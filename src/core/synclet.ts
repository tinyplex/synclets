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
        if (await connector.hasChildren(address)) {
          if (isHash(node)) {
            log(`recv Hash(${address}) from ${from}`);
            return receiveHash(address, node, from);
          }
          if (isSubNodes(node)) {
            log(`recv SubNodes(${address}) from ${from}`);
            return receiveSubNodes(address, node, from);
          }
        } else {
          const myTimestamp = await connector.getTimestamp(address);
          if (isTimestamp(node)) {
            log(`recv Timestamp(${address}) from ${from}`);
            return receiveTimestamp(address, myTimestamp, node, from);
          }
          if (isTimestampAndValue(node)) {
            log(`recv TimestampAndValue(${address}) from ${from}`);
            return receiveTimestampAndValue(address, myTimestamp, node, from);
          }
        }
        log(`structure mismatch: ${address}`, 'warn');
      }
      log(`invalid from: ${from}`, 'warn');
    });

  const receiveTimestamp = async (
    address: Address,
    myTimestamp: Timestamp,
    otherTimestamp: Timestamp,
    from: string,
  ) => {
    if (otherTimestamp > myTimestamp) {
      await sendMessage(address, myTimestamp, from);
    } else if (otherTimestamp < myTimestamp) {
      await sendMessage(
        address,
        [myTimestamp, await connector.get(address)],
        from,
      );
    }
  };

  const receiveTimestampAndValue = async (
    address: Address,
    myTimestamp: Timestamp,
    otherTimestampAndValue: TimestampAndValue,
    from: string,
  ) => {
    const [otherTimestamp, otherValue] = otherTimestampAndValue;
    if (otherTimestamp > myTimestamp) {
      await connector.setTimestampAndValue(address, otherTimestamp, otherValue);
    } else if (myTimestamp > otherTimestamp) {
      await sendMessage(
        address,
        [myTimestamp, await connector.get(address)],
        from,
      );
    }
  };

  const receiveHash = async (
    address: Address,
    otherHash: Hash,
    from: string,
  ) => {
    if (otherHash !== (await connector.getHash(address))) {
      await sendMessage(address, await buildSubNodesForHash(address), from);
    }
  };

  const buildSubNodesForHash = async (address: Address) => {
    const subNodes: SubNodes = [{}];
    await promiseAll(
      arrayMap(await connector.getChildren(address), async (id) => {
        const subAddress = [...address, id];
        subNodes[0][id] = await (
          (await connector.hasChildren(subAddress))
            ? connector.getHash
            : connector.getTimestamp
        )(subAddress);
      }),
    );
    return subNodes;
  };

  const receiveSubNodes = async (
    address: Address,
    otherSubNodes: SubNodes,
    from: string,
  ) => {
    const mySubNodes = await processSubNodesForSubNodes(address, otherSubNodes);
    if (objNotEmpty(mySubNodes[0])) {
      await sendMessage(address, mySubNodes, from);
    }
  };

  const processMySubNodes = async (
    address: Address,
    otherIds: string[] = [],
  ) => {
    const mySubNodes: SubNodes = [{}];
    await promiseAll(
      arrayMap(
        arrayDifference(await connector.getChildren(address), otherIds),
        async (id) => {
          const subAddress = [...address, id];
          mySubNodes[0][id] = await (
            (await connector.hasChildren(subAddress))
              ? processMySubNodes
              : connector.getTimestampAndValue
          )(subAddress);
        },
      ),
    );
    return mySubNodes;
  };

  const processSubNodesForSubNodes = async (
    address: Address,
    [otherSubNodesById, partial]: SubNodes,
  ) => {
    const otherIds = objKeys(otherSubNodesById);
    const mySubNodes: SubNodes = partial
      ? [{}]
      : await processMySubNodes(address, otherIds);

    await promiseAll(
      arrayMap(otherIds, async (id) => {
        const otherSubNode = otherSubNodesById[id];
        const subAddress = [...address, id];

        if (isHash(otherSubNode)) {
          if ((await connector.getHash(subAddress)) != otherSubNode) {
            mySubNodes[0][id] = await buildSubNodesForHash(subAddress);
          }
        } else if (isSubNodes(otherSubNode)) {
          const mySubSubNodes = await processSubNodesForSubNodes(
            subAddress,
            otherSubNode,
          );
          if (objNotEmpty(mySubSubNodes[0])) {
            mySubNodes[0][id] = mySubSubNodes;
          }
        } else {
          const otherIsTimestamp = isTimestamp(otherSubNode);
          const otherTimestamp = otherIsTimestamp
            ? otherSubNode
            : otherSubNode[0];

          const myTimestamp = await connector.getTimestamp(subAddress);

          if (otherTimestamp > myTimestamp) {
            if (otherIsTimestamp) {
              mySubNodes[0][id] = myTimestamp;
            } else {
              await connector.setTimestampAndValue(subAddress, ...otherSubNode);
            }
          } else if (otherTimestamp < myTimestamp) {
            mySubNodes[0][id] = await connector.getTimestampAndValue(
              subAddress,
              myTimestamp,
            );
          }

          if (mySubNodes[0][id] === undefined) {
            mySubNodes[1] = 1;
          }
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
