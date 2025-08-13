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
  ifEqual?: (timestamp: Timestamp) => void | Promise<void>,
): void | Promise<void> | 0 =>
  otherTimestamp > myTimestamp
    ? ifOtherNewer(otherTimestamp, myTimestamp)
    : otherTimestamp < myTimestamp
      ? ifMineNewer?.(myTimestamp)
      : ifEqual?.(myTimestamp);

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

  const getTimestampAndValue = async (
    address: Address,
    timestamp?: Timestamp,
  ): Promise<TimestampAndValue> => [
    timestamp ?? (await connector.getTimestamp(address)),
    await connector.get(address),
  ];

  const setTimestampAndValue = async (
    address: Address,
    timestamp: Timestamp,
    value: Value,
  ): Promise<void> => {
    log(`set(${address})`);
    await connector.set(address, value);
    await connector.setTimestamp(address, timestamp);
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

  const sendNode = async (
    address: Address,
    node: Node,
    to?: string,
    partial: 0 | 1 = 0,
  ) => {
    log(`send Node(${address}) to ${to}`);
    await sendMessage([MessageType.Node, address, node, partial], to);
  };

  // #endregion

  // #region receive

  const receiveMessage = (message: Message, from: string) =>
    queueIfStarted(async () => {
      if (from !== ASTERISK && from !== id) {
        const [type, address, arg1, arg2 = 0] = message;
        switch (type) {
          case MessageType.Node: {
            return await receiveNode(address, arg1, arg2, from);
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
    partial: 0 | 1,
    from: string,
  ) => {
    log(`recv Node(${address}) from ${from}`);
    const hasChildren = await connector.hasChildren(address);

    if (isTimestamp(otherNode)) {
      if (hasChildren) {
        log(`structure mismatch: ${address}`, 'warn');
      } else {
        const myTimestamp = await connector.getTimestamp(address);

        if (otherNode > myTimestamp) {
          await sendNode(address, myTimestamp, from);
        } else if (otherNode < myTimestamp) {
          await sendNode(
            address,
            [myTimestamp, await connector.get(address)],
            from,
          );
        }
      }
    }

    if (isTimestampAndValue(otherNode)) {
      if (hasChildren) {
        log(`structure mismatch: ${address}`, 'warn');
      } else {
        const [otherTimestamp, otherValue] = otherNode;
        const myTimestamp = await connector.getTimestamp(address);

        if (otherTimestamp > myTimestamp) {
          await setTimestampAndValue(address, otherTimestamp, otherValue);
        } else if (myTimestamp > otherTimestamp) {
          await sendNode(
            address,
            [myTimestamp, await connector.get(address)],
            from,
          );
        }
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
          await sendNode(address, timestamps, from);
        }
      }
    }

    if (isSubNodes(otherNode)) {
      if (!hasChildren) {
        log(`structure mismatch: ${address}`, 'warn');
      } else {
        const subNodes: SubNodes = {};
        const otherIds = setNew(objKeys(otherNode));

        if (!partial) {
          await promiseAll(
            arrayMap(
              [
                ...setNew(await connector.getChildren(address)).difference(
                  otherIds,
                ),
              ],
              async (id) => {
                subNodes[id] = await getTimestampAndValue([...address, id]);
              },
            ),
          );
        }

        partial = 0;
        await promiseAll(
          arrayMap([...otherIds], async (id) => {
            const otherSubNode = otherNode[id] as Timestamp | TimestampAndValue;

            const otherIsTimestamp = isTimestamp(otherSubNode);
            const otherTimestamp = otherIsTimestamp
              ? otherSubNode
              : otherSubNode[0];

            const subAddress = [...address, id];
            const myTimestamp = await connector.getTimestamp(subAddress);

            if (otherTimestamp > myTimestamp) {
              if (otherIsTimestamp) {
                subNodes[id] = myTimestamp;
              } else {
                await setTimestampAndValue(subAddress, ...otherSubNode);
              }
            } else if (otherTimestamp < myTimestamp) {
              subNodes[id] = await getTimestampAndValue(
                subAddress,
                myTimestamp,
              );
            }

            if (subNodes[id] === undefined) {
              partial = 1;
            }
          }),
        );

        if (objNotEmpty(subNodes)) {
          await sendNode(address, subNodes, from, partial);
        }
      }
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
