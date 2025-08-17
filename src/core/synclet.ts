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
  TimestampAndValue,
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
  isTimestampAndValue,
  isUndefined,
  objFromEntries,
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
  {canReceiveMessage}: SyncletImplementations = {},
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

  const sync = (address: Address) =>
    queueIfStarted(async () => {
      log(`sync: ${address}`);
      if (await connector.hasChildren(address, {})) {
        await sendNodeMessage(address, await connector.getHash(address, {}));
      } else {
        await sendNodeMessage(
          address,
          await connector.getTimestamp(address, {}),
        );
      }
    });

  // #region send/receive

  const sendNodeMessage = async (address: Address, node: Node, to?: string) =>
    await transport.sendMessage([MessageType.Node, address, node], to);

  const receiveMessage = (message: Message, from: string) =>
    queueIfStarted(async () => {
      if (from !== ASTERISK && from !== id) {
        const [type, address, node, context = {}] = message;
        if (
          isUndefined(canReceiveMessage) ||
          (await canReceiveMessage(type, address, node, context))
        ) {
          if (type == MessageType.Node) {
            return await transformNode(
              address,
              node,
              context,
              (newNode) => sendNodeMessage(address, newNode, from),
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
          : isTimestampAndValue(node)
            ? transformTimestampAndValue
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
      const myTimestamp = await connector.getTimestamp(address, context);
      if (otherTimestamp > myTimestamp) {
        return myTimestamp;
      } else if (otherTimestamp < myTimestamp) {
        return [myTimestamp, await connector.get(address, context)];
      }
    } else {
      log(`${INVALID_NODE}; Timestamp vs SubNodes: ${address}`, 'warn');
    }
  };

  const transformTimestampAndValue = async (
    address: Address,
    otherTimestampAndValue: TimestampAndValue,
    context: Context,
  ): Promise<Node | undefined> => {
    if (!(await connector.hasChildren(address, context))) {
      const myTimestamp = await connector.getTimestamp(address, context);
      const [otherTimestamp, otherValue] = otherTimestampAndValue;
      if (otherTimestamp > myTimestamp) {
        await connector.setTimestampAndValue(
          address,
          otherTimestamp,
          otherValue,
          context,
        );
      } else if (myTimestamp > otherTimestamp) {
        return [myTimestamp, await connector.get(address, context)];
      }
    } else {
      log(`${INVALID_NODE}; TimestampValue vs SubNodes: ${address}`, 'warn');
    }
  };

  const transformHash = async (
    address: Address,
    otherHash: Hash,
    context: Context,
  ): Promise<Node | undefined> => {
    if (await connector.hasChildren(address, context)) {
      if (otherHash !== (await connector.getHash(address, context))) {
        return [
          objFromEntries(
            await promiseAll(
              arrayMap(
                await connector.getChildren(address, context),
                async (id) => [
                  id,
                  await connector.getHashOrTimestamp([...address, id], context),
                ],
              ),
            ),
          ),
        ];
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
        : await getFullNodes(address, context, objKeys(otherSubNodeObj));
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

  const getFullNodes = async (
    address: Address,
    context: Context,
    except: string[] = [],
  ): Promise<SubNodes> => [
    objFromEntries(
      await promiseAll(
        arrayMap(
          arrayDifference(
            await connector.getChildren(address, context),
            except,
          ),
          async (id) => [
            id,
            await (
              (await connector.hasChildren([...address, id], context))
                ? getFullNodes
                : connector.getTimestampAndValue
            )([...address, id], context),
          ],
        ),
      ),
    ),
  ];

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
