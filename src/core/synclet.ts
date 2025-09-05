import type {
  Address,
  Context,
  createSynclet as createSyncletDecl,
  Hash,
  LogLevel,
  Node,
  SubNodes,
  Synclet,
  SyncletImplementations,
  SyncletOptions,
  Timestamp,
  TimestampAndAtom,
} from '@synclets/@types';
import {
  arrayDifference,
  arrayMap,
  ASTERISK,
  getUniqueId,
  ifNotUndefined,
  isHash,
  isSubNodes,
  isTimestamp,
  isTimestampAndAtom,
  isUndefined,
  objKeys,
  objMap,
  objNotEmpty,
  promiseAll,
} from '@synclets/utils';
import {MessageType} from './message.ts';
import type {
  Message,
  ProtectedConnector,
  ProtectedTransport,
} from './protected.d.ts';
import {getQueueFunctions} from './queue.ts';

const INVALID_NODE = 'invalid node';

export const createSynclet: typeof createSyncletDecl = ((
  connector: ProtectedConnector,
  transport: ProtectedTransport,
  {canReceiveMessage, getSendContext}: SyncletImplementations = {},
  options: SyncletOptions = {},
): Synclet => {
  let started = false;
  const id = options.id ?? getUniqueId();
  const logger = options.logger ?? {};
  const [queue, getQueueState] = getQueueFunctions();

  const queueIfStarted = async (actions: () => Promise<void>) => {
    if (started) {
      await queue(actions);
    }
  };

  const readHashOrTimestamp = async (address: Address, context: Context) =>
    await (
      (await connector.hasChildren(address, context))
        ? connector.readHash
        : connector.readTimestamp
    )(address, context);

  const readFullNodesOrAtomAndTimestamp = async (
    address: Address,
    context: Context,
  ): Promise<SubNodes | TimestampAndAtom | undefined> => {
    if (await connector.hasChildren(address, context)) {
      return await readFullNodes(address, context);
    }
    const timestamp = await connector.readTimestamp(address, context);
    const atom = await connector.readAtom(address, context);
    if (!isUndefined(timestamp) && !isUndefined(atom)) {
      return [timestamp, atom];
    }
  };

  const readFullNodes = async (
    address: Address,
    context: Context,
    except: string[] = [],
  ): Promise<SubNodes> => {
    const subNodeObj: {[id: string]: Node} = {};
    await promiseAll(
      arrayMap(
        arrayDifference(
          (await connector.readChildrenIds(address, context)) ?? [],
          except,
        ),
        async (id) =>
          ifNotUndefined(
            await readFullNodesOrAtomAndTimestamp([...address, id], context),
            (fullNodesOrAtomAndTimestamp) => {
              subNodeObj[id] = fullNodesOrAtomAndTimestamp;
            },
          ),
      ),
    );
    return [subNodeObj];
  };

  const sync = (address: Address) =>
    queueIfStarted(async () => {
      log(`sync: ${address}`);
      await ifNotUndefined(
        await readHashOrTimestamp(address, {}),
        (hashOrTimestamp) => sendNodeMessage(address, hashOrTimestamp),
      );
    });

  // #region send/receive

  const sendNodeMessage = async (
    address: Address,
    node: Node,
    receivedContext: Context = {},
    to?: string,
  ) =>
    await transport.sendMessage(
      [
        MessageType.Node,
        address,
        node,
        (await getSendContext?.(
          MessageType.Node,
          address,
          node,
          receivedContext,
        )) ?? {},
      ],
      to,
    );

  const receiveMessage = (message: Message, from: string) =>
    queueIfStarted(async () => {
      if (from !== ASTERISK && from !== id) {
        const [type, address, node, context] = message;
        if (
          isUndefined(canReceiveMessage) ||
          (await canReceiveMessage(type, address, node, context))
        ) {
          if (type == MessageType.Node) {
            return await transformNode(
              address,
              node,
              context,
              (newNode) => sendNodeMessage(address, newNode, context, from),
              () => log(`${INVALID_NODE}: ${address}`, 'warn'),
            );
          }
        }
      }
      log(`invalid message: ${from}`, 'warn');
    });

  // #endregion

  // #region transform

  const transformNode = async (
    address: Address,
    node: Node,
    context: Context,
    ifDefined: (newNode: Node) => Promise<void> | void,
    ifUndefined?: () => void,
  ) =>
    await ifNotUndefined(
      await (
        (isTimestamp(node)
          ? transformTimestamp
          : isTimestampAndAtom(node)
            ? transformTimestampAndAtom
            : isHash(node)
              ? transformHash
              : isSubNodes(node)
                ? transformSubNodes
                : undefined) as any
      )?.(address, node, context),
      ifDefined,
      ifUndefined,
    );

  const transformTimestamp = async (
    address: Address,
    otherTimestamp: Timestamp,
    context: Context,
  ): Promise<Node | undefined> => {
    if (!(await connector.hasChildren(address, context))) {
      const myTimestamp =
        (await connector.readTimestamp(address, context)) ?? '';
      if (otherTimestamp > myTimestamp) {
        return myTimestamp;
      } else if (otherTimestamp < myTimestamp) {
        const value = await connector.readAtom(address, context);
        if (value !== undefined) {
          return [myTimestamp, value];
        }
      }
    } else {
      log(`${INVALID_NODE}; Timestamp vs SubNodes: ${address}`, 'warn');
    }
  };

  const transformTimestampAndAtom = async (
    address: Address,
    otherTimestampAndAtom: TimestampAndAtom,
    context: Context,
  ): Promise<Node | undefined> => {
    if (!(await connector.hasChildren(address, context))) {
      const myTimestamp =
        (await connector.readTimestamp(address, context)) ?? '';
      const [otherTimestamp, otherAtom] = otherTimestampAndAtom;
      if (otherTimestamp > myTimestamp) {
        await connector.setAtom(
          address,
          otherAtom,
          context,
          otherTimestamp,
          myTimestamp,
        );
      } else if (myTimestamp > otherTimestamp) {
        const value = await connector.readAtom(address, context);
        if (value !== undefined) {
          return [myTimestamp, value];
        }
      }
    } else {
      log(`${INVALID_NODE}; TimestampAtom vs SubNodes: ${address}`, 'warn');
    }
  };

  const transformHash = async (
    address: Address,
    otherHash: Hash,
    context: Context,
  ): Promise<Node | undefined> => {
    if (await connector.hasChildren(address, context)) {
      if (otherHash !== (await connector.readHash(address, context))) {
        const subNodeObj: {[id: string]: Node} = {};
        await promiseAll(
          arrayMap(
            (await connector.readChildrenIds(address, context)) ?? [],
            async (id) =>
              ifNotUndefined(
                await readHashOrTimestamp([...address, id], context),
                (hashOrTimestamp) => (subNodeObj[id] = hashOrTimestamp),
              ),
          ),
        );
        return [subNodeObj];
      }
    } else {
      log(`${INVALID_NODE}; Hash vs no SubNodes: ${address}`, 'warn');
    }
  };

  const transformSubNodes = async (
    address: Address,
    [otherSubNodeObj, partial]: SubNodes,
    context: Context,
  ): Promise<Node | undefined> => {
    if (await connector.hasChildren(address, context)) {
      const mySubNodes: SubNodes = partial
        ? [{}]
        : await readFullNodes(address, context, objKeys(otherSubNodeObj));
      await promiseAll(
        objMap(otherSubNodeObj, (id, otherSubNode) =>
          transformNode(
            [...address, id],
            otherSubNode,
            context,
            (newNode) => {
              mySubNodes[0][id] = newNode;
            },
            () => {
              mySubNodes[1] = 1;
            },
          ),
        ),
      );
      if (objNotEmpty(mySubNodes[0])) {
        return mySubNodes;
      }
    } else {
      log(`${INVALID_NODE}; SubNodes vs no SubNodes: ${address}`, 'warn');
    }
  };

  // #endregion

  // #region public

  const getId = () => id;

  const getStarted = () => started;

  const start = async () => {
    log('start');
    await connector.connect(sync);
    await transport.connect(receiveMessage);
    started = true;
    await sync([]);
  };

  const stop = async () => {
    log('stop');
    await connector.disconnect();
    await transport.disconnect();
    started = false;
  };

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[${id}] ${string}`);

  // #endregion

  const synclet: Synclet = {
    __brand: 'Synclet',

    getId,
    getStarted,
    getQueueState,
    start,
    stop,
    log,
  };

  log('createSynclet');
  connector.attachToSynclet(synclet);
  transport.attachToSynclet(synclet);
  return synclet;
}) as any;
