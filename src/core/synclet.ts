import type {
  Address,
  Atom,
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
  Tomb,
} from '@synclets/@types';
import {
  arrayDifference,
  arrayMap,
  ASTERISK,
  EMPTY_STRING,
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
  TOMB,
} from '@synclets/utils';
import {MessageType} from './message.ts';
import type {
  Message,
  ProtectedConnector,
  ProtectedTransport,
} from './protected.d.ts';
import {getQueueFunctions} from './queue.ts';

const INVALID_NODE = 'invalid node';

export const createSynclet: typeof createSyncletDecl = (async (
  connector: ProtectedConnector,
  transport: ProtectedTransport,
  {canReceiveMessage, getSendContext}: SyncletImplementations = {},
  options: SyncletOptions = {},
): Promise<Synclet> => {
  let started = false;
  const id = options.id ?? getUniqueId();
  const logger = options.logger ?? {};
  const [queue] = getQueueFunctions();

  const queueIfStarted = async (actions: () => Promise<void>) => {
    if (started) {
      await queue(actions);
    }
  };

  const readHashOrTimestamp = async (address: Address, context: Context) =>
    (await connector.isParent(address, context))
      ? ((await connector.readHash(address, context)) ?? 0)
      : ((await connector.readTimestamp(address, context)) ?? EMPTY_STRING);

  const readFullNodesOrAtomAndTimestamp = async (
    address: Address,
    context: Context,
  ): Promise<SubNodes | TimestampAndAtom | undefined> => {
    if (await connector.isParent(address, context)) {
      return await readFullNodes(address, context);
    }
    const timestamp = await connector.readTimestamp(address, context);
    if (!isUndefined(timestamp)) {
      return [timestamp, await readAtomOrTomb(address, context)];
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
          (await connector.readChildIds(address, context, true)) ?? [],
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

  const readAtomOrTomb = async (
    address: Address,
    context: Context,
  ): Promise<Atom | Tomb> => {
    const atom = await connector.readAtom(address, context);
    return isUndefined(atom) ? TOMB : atom;
  };

  const sync = (address: Address) =>
    queueIfStarted(async () => {
      log(`sync ${address}`);
      await sendNodeMessage(address, await readHashOrTimestamp(address, {}));
    });

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
    if (!(await connector.isParent(address, context))) {
      const myTimestamp =
        (await connector.readTimestamp(address, context)) ?? EMPTY_STRING;
      if (otherTimestamp > myTimestamp) {
        return myTimestamp;
      } else if (otherTimestamp < myTimestamp) {
        return [myTimestamp, await readAtomOrTomb(address, context)];
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
    if (!(await connector.isParent(address, context))) {
      const myTimestamp =
        (await connector.readTimestamp(address, context)) ?? EMPTY_STRING;
      const [otherTimestamp, otherAtom] = otherTimestampAndAtom;
      if (otherTimestamp > myTimestamp) {
        await connector.setOrDelAtom(
          address,
          otherAtom,
          context,
          false,
          otherTimestamp,
          myTimestamp,
        );
      } else if (otherTimestamp < myTimestamp) {
        return [myTimestamp, await readAtomOrTomb(address, context)];
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
    if (await connector.isParent(address, context)) {
      if (otherHash !== (await connector.readHash(address, context))) {
        const subNodeObj: {[id: string]: Node} = {};
        await promiseAll(
          arrayMap(
            (await connector.readChildIds(address, context, true)) ?? [],
            async (id) => {
              subNodeObj[id] = await readHashOrTimestamp(
                [...address, id],
                context,
              );
            },
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
    if (await connector.isParent(address, context)) {
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

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[S:${id}] ${string}`);

  const synclet: Synclet = {
    __brand: 'Synclet',

    log,

    start: async () => {
      if (!started) {
        log('start');
        await connector.start();
        await transport.connect?.(receiveMessage);
        started = true;
        await sync([]);
      }
    },

    stop: async () => {
      if (started) {
        log('stop');
        await connector.disconnect?.();
        await transport.disconnect?.();
        started = false;
      }
    },
    sync,
  };

  connector.attachToSynclet(synclet);
  transport.attachToSynclet(synclet);
  return synclet;
}) as any;
