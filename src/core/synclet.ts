import type {
  Address,
  createSynclet as createSyncletDecl,
  Hash,
  LogLevel,
  Synclet,
  SyncletOptions,
  Timestamp,
  Value,
} from '@synclets/@types';
import {
  arrayMap,
  arrayPush,
  ASTERISK,
  getUniqueId,
  isObject,
  objEvery,
  objKeys,
  objNotEmpty,
  promiseAll,
  setNew,
  size,
} from '@synclets/utils';
import {MessageType} from './message.ts';
import type {
  Message,
  Node,
  ProtectedConnector,
  ProtectedTransport,
  SubNodes,
  TimestampAndValue,
} from './protected.d.ts';
import {getQueueFunctions} from './queue.ts';

const compareTimestamps = (
  otherTimestamp: Timestamp,
  myTimestamp: Timestamp,
  ifOtherNewer: (
    otherTimestamp: Timestamp,
    myTimestamp: Timestamp,
  ) => void | Promise<void>,
  ifMineNewer?: (myTimestamp: Timestamp) => void | Promise<void>,
): void | Promise<void> | 0 =>
  otherTimestamp > myTimestamp
    ? ifOtherNewer(otherTimestamp, myTimestamp)
    : otherTimestamp < myTimestamp
      ? ifMineNewer?.(myTimestamp)
      : 0;

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
        await sendNode(address, await connector.getHash(address));
      } else {
        await sendNode(address, await connector.getTimestamp(address));
      }
    });

  // #region send

  const sendMessage = transport.sendMessage;

  const sendNode = async (address: Address, node: Node, to?: string) => {
    log(`send Node(${address}) to ${to}`);
    await sendMessage([MessageType.Node, address, node], to);
  };

  const sendTimestamps = async (
    address: Address,
    timestamps: {[id: string]: Timestamp},
    to?: string,
  ) => {
    log(`send Timestamps(${address}) to ${to}`);
    await sendMessage([MessageType.Timestamps, address, timestamps], to);
  };

  const sendTimestampsAndValues = async (
    address: Address,
    timestampsAndValues: {[id: string]: [Timestamp, Value]},
    needIds: string[],
    to?: string,
  ) => {
    log(`send TimestampsAndValues(${address}) to ${to}`);
    await sendMessage(
      [MessageType.TimestampsAndValues, address, timestampsAndValues, needIds],
      to,
    );
  };

  // #endregion

  // #region receive

  const receiveMessage = (message: Message, from: string) =>
    queueIfStarted(async () => {
      if (from !== ASTERISK && from !== id) {
        const [type, address, arg1, arg2] = message;
        switch (type) {
          case MessageType.Node: {
            return await receiveNode(address, arg1, from);
          }
          case MessageType.Timestamps: {
            return await receiveTimestamps(address, arg1, from);
          }
          case MessageType.TimestampsAndValues: {
            return await receiveTimestampsAndValues(address, arg1, arg2, from);
          }
        }
      }
    });

  const isNode = (node: any): node is Node =>
    isTimestamp(node) ||
    isTimestampAndValue(node) ||
    isHash(node) ||
    isSubNodes(node);

  const isTimestamp = (node: Node): node is Timestamp =>
    typeof node === 'string';

  const isValue = (value: Value): value is Value =>
    value === null ||
    typeof value === 'number' ||
    typeof value === 'string' ||
    typeof value === 'boolean';

  const isTimestampAndValue = (node: Node): node is TimestampAndValue =>
    Array.isArray(node) &&
    size(node) == 2 &&
    isTimestamp(node[0]) &&
    isValue(node[1]);

  const isHash = (node: Node): node is Hash => typeof node === 'number';

  const isSubNodes = (node: Node): node is {[id: string]: Node} =>
    isObject(node) && objEvery(node, isNode);

  const receiveNode = async (
    address: Address,
    otherNode: Node,
    from: string,
  ) => {
    log(`recv Node(${address}) from ${from}`);
    const hasChildren = await connector.hasChildren(address);

    if (isTimestamp(otherNode)) {
      if (hasChildren) {
        log(`structure mismatch: ${address}`, 'warn');
      } else {
        await compareTimestamps(
          otherNode,
          await connector.getTimestamp(address),
          (_, myTimestamp) => sendNode(address, myTimestamp, from),
          async (myTimestamp) =>
            await sendNode(
              address,
              [myTimestamp, await connector.get(address)],
              from,
            ),
        );
      }
    }

    if (isTimestampAndValue(otherNode)) {
      if (hasChildren) {
        log(`structure mismatch: ${address}`, 'warn');
      } else {
        await compareTimestamps(
          otherNode[0],
          await connector.getTimestamp(address),
          async (otherTimestamp) => {
            log(`set(${address}) from ${from}`);
            await connector.set(address, otherNode[1]);
            await connector.setTimestamp(address, otherTimestamp);
          },
          async (myTimestamp) =>
            await sendNode(
              address,
              [myTimestamp, await connector.get(address)],
              from,
            ),
        );
      }
    }

    if (isHash(otherNode)) {
      if (!hasChildren) {
        log(`structure mismatch: ${address}`, 'warn');
      } else {
        if (otherNode !== (await connector.getHash(address))) {
          const timestamps: {[id: string]: Timestamp} = {};
          await promiseAll(
            arrayMap(await connector.getChildren(address), async (id) => {
              timestamps[id] = await connector.getTimestamp([...address, id]);
            }),
          );
          await sendTimestamps(address, timestamps, from);
        }
      }
    }

    if (isSubNodes(otherNode)) {
      if (!hasChildren) {
        log(`structure mismatch: ${address}`, 'warn');
      } else {
        const myChildrenIds = setNew(await connector.getChildren(address));
        const otherChildrenIds = setNew(objKeys(otherNode));
        const nextNode: SubNodes = {};

        const bothIds = [...myChildrenIds.intersection(otherChildrenIds)];
        const onlyThisIds = [...myChildrenIds.difference(otherChildrenIds)];
        const onlyOtherIds = [...otherChildrenIds.difference(myChildrenIds)];

        await promiseAll(
          arrayMap(onlyThisIds, async (id) => {
            nextNode[id] = [
              await connector.getTimestamp([...address, id]),
              await connector.get([...address, id]),
            ];
          }),
        );

        await promiseAll(
          arrayMap(bothIds, async (id) => {
            await compareTimestamps(
              otherNode[id] as Timestamp,
              await connector.getTimestamp([...address, id]),
              (_, myTimestamp) => {
                nextNode[id] = myTimestamp;
              },
              async (myTimestamp) => {
                nextNode[id] = [
                  myTimestamp,
                  await connector.get([...address, id]),
                ];
              },
            );
          }),
        );

        await promiseAll(
          arrayMap(onlyOtherIds, async (id) => {
            nextNode[id] = 0;
          }),
        );

        await sendNode(address, nextNode, from);
      }
    }
  };

  const receiveTimestamps = async (
    address: Address,
    otherTimestamps: {[id: string]: Timestamp},
    from: string,
  ) => {
    log(`recv Timestamps(${address}) from ${from}`);
    const otherIds = setNew(objKeys(otherTimestamps));
    const myIds = setNew(await connector.getChildren(address));

    const bothIds = [...myIds.intersection(otherIds)];
    const onlyMyIds = [...myIds.difference(otherIds)];
    const needIds = [...otherIds.difference(myIds)];

    const timestampsAndValues: {[id: string]: [Timestamp, Value]} = {};

    await promiseAll(
      arrayMap(onlyMyIds, async (id) => {
        timestampsAndValues[id] = [
          await connector.getTimestamp([...address, id]),
          await connector.get([...address, id]),
        ];
      }),
    );

    await promiseAll(
      arrayMap(bothIds, async (id) => {
        await compareTimestamps(
          otherTimestamps[id],
          await connector.getTimestamp([...address, id]),
          () => arrayPush(needIds, id),
          async (myTimestamp) => {
            timestampsAndValues[id] = [
              myTimestamp,
              await connector.get([...address, id]),
            ];
          },
        );
      }),
    );

    await sendTimestampsAndValues(address, timestampsAndValues, needIds, from);
  };

  const receiveTimestampsAndValues = async (
    address: Address,
    otherTimestampsAndValues: {[id: string]: [Timestamp, Value]},
    needIds: string[],
    from: string,
  ) => {
    log(`recv TimestampsAndValues(${address}) from ${from}`);
    const neededTimestampsAndValues: {[id: string]: [Timestamp, Value]} = {};

    await promiseAll(
      arrayMap(
        objKeys(otherTimestampsAndValues),
        async (id) =>
          await compareTimestamps(
            otherTimestampsAndValues[id][0],
            await connector.getTimestamp([...address, id]),
            async (otherTimestamp) => {
              log(`set(${address}) from ${from}`);
              await connector.set(
                [...address, id],
                otherTimestampsAndValues[id][1],
              );
              await connector.setTimestamp([...address, id], otherTimestamp);
            },
            async (myTimestamp) => {
              neededTimestampsAndValues[id] = [
                myTimestamp,
                await connector.get([...address, id]),
              ];
            },
          ),
      ),
    );

    await promiseAll(
      arrayMap(needIds, async (id) => {
        neededTimestampsAndValues[id] = [
          await connector.getTimestamp([...address, id]),
          await connector.get([...address, id]),
        ];
      }),
    );
    if (objNotEmpty(neededTimestampsAndValues)) {
      await sendTimestampsAndValues(
        address,
        neededTimestampsAndValues,
        [],
        from,
      );
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
