import type {
  Address,
  createSynclet as createSyncletDecl,
  Hash,
  LogLevel,
  Node,
  SubNodes,
  Synclet,
  SyncletOptions,
  Timestamp,
  TimestampAndValue,
} from '@synclets/@types';
import {
  arrayDifference,
  arrayMap,
  ASTERISK,
  getUniqueId,
  isHash,
  isSubNodes,
  isTimestamp,
  isTimestampAndValue,
  objFromEntries,
  objKeys,
  objNotEmpty,
  promiseAll,
} from '@synclets/utils';
import type {
  Message,
  ProtectedConnector,
  ProtectedTransport,
} from './protected.d.ts';
import {getQueueFunctions} from './queue.ts';

export const createSynclet: typeof createSyncletDecl = ((
  connector: ProtectedConnector,
  transport: ProtectedTransport,
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

      if (await connector.hasChildren(address)) {
        await sendMessage(address, await connector.getHash(address));
      } else {
        await sendMessage(address, await connector.getTimestamp(address));
      }
    });

  // #region send

  const sendMessage = async (address: Address, node: Node, to?: string) =>
    await transport.sendMessage([address, node], to);

  // #endregion

  // #region receive

  const receiveMessage = (message: Message, from: string) =>
    queueIfStarted(async () => {
      if (from !== ASTERISK && from !== id) {
        const [address, node] = message;
        const transform: any = isTimestamp(node)
          ? transformTimestamp
          : isTimestampAndValue(node)
            ? transformTimestampAndValue
            : isHash(node)
              ? transformHash
              : isSubNodes(node)
                ? transformSubNodes
                : undefined;
        const newNode = await transform?.(address, node);
        if (newNode !== undefined) {
          return await sendMessage(address, newNode, from);
        }
      }
      log(`invalid message: ${from}`, 'warn');
    });

  const transformTimestamp = async (
    address: Address,
    otherTimestamp: Timestamp,
  ): Promise<Node | undefined> => {
    if (!(await connector.hasChildren(address))) {
      const myTimestamp = await connector.getTimestamp(address);
      if (otherTimestamp > myTimestamp) {
        return myTimestamp;
      } else if (otherTimestamp < myTimestamp) {
        return [myTimestamp, await connector.get(address)];
      }
    }
    log(`mismatch; Timestamp vs SubNodes: ${address}`, 'warn');
  };

  const transformTimestampAndValue = async (
    address: Address,
    otherTimestampAndValue: TimestampAndValue,
  ): Promise<Node | undefined> => {
    if (!(await connector.hasChildren(address))) {
      const myTimestamp = await connector.getTimestamp(address);
      const [otherTimestamp, otherValue] = otherTimestampAndValue;
      if (otherTimestamp > myTimestamp) {
        await connector.setTimestampAndValue(
          address,
          otherTimestamp,
          otherValue,
        );
      } else if (myTimestamp > otherTimestamp) {
        return [myTimestamp, await connector.get(address)];
      }
    }
    log(`mismatch; TimestampValue vs SubNodes: ${address}`, 'warn');
  };

  const transformHash = async (
    address: Address,
    otherHash: Hash,
  ): Promise<Node | undefined> => {
    if (await connector.hasChildren(address)) {
      if (otherHash !== (await connector.getHash(address))) {
        return [
          objFromEntries(
            await promiseAll(
              arrayMap(await connector.getChildren(address), async (id) => [
                id,
                await connector.getHashOrTimestamp([...address, id]),
              ]),
            ),
          ),
        ];
      }
    }
    log(`mismatch; Hash vs no SubNodes: ${address}`, 'warn');
  };

  const transformSubNodes = async (
    address: Address,
    otherSubNodes: SubNodes,
  ): Promise<Node | undefined> => {
    if (await connector.hasChildren(address)) {
      const mySubNodes = await processSubNodesForSubNodes(
        address,
        otherSubNodes,
      );
      if (objNotEmpty(mySubNodes[0])) {
        return mySubNodes;
      }
    }
    log(`mismatch; SubNodes vs no SubNodes: ${address}`, 'warn');
  };

  const getFullNodes = async (
    address: Address,
    except: string[] = [],
  ): Promise<SubNodes> => [
    objFromEntries(
      await promiseAll(
        arrayMap(
          arrayDifference(await connector.getChildren(address), except),
          async (id) => [
            id,
            await (
              (await connector.hasChildren([...address, id]))
                ? getFullNodes
                : connector.getTimestampAndValue
            )([...address, id]),
          ],
        ),
      ),
    ),
  ];

  const processSubNodesForSubNodes = async (
    address: Address,
    [otherSubNodesById, partial]: SubNodes,
  ) => {
    const otherIds = objKeys(otherSubNodesById);
    const mySubNodes: SubNodes = partial
      ? [{}]
      : await getFullNodes(address, otherIds);

    await promiseAll(
      arrayMap(otherIds, async (id) => {
        const otherSubNode = otherSubNodesById[id];
        const subAddress = [...address, id];

        const transform: any = isTimestamp(otherSubNode)
          ? transformTimestamp
          : isTimestampAndValue(otherSubNode)
            ? transformTimestampAndValue
            : isHash(otherSubNode)
              ? transformHash
              : isSubNodes(otherSubNode)
                ? transformSubNodes
                : undefined;

        const newNode = await transform?.(subAddress, otherSubNode);
        if (newNode !== undefined) {
          mySubNodes[0][id] = newNode;
        } else {
          mySubNodes[1] = 1;
        }
      }),
    );
    return mySubNodes;
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
