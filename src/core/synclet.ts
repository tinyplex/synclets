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

  // #endregion

  // #region receive

  const receiveMessage = (message: Message, from: string) =>
    queueIfStarted(async () => {
      if (from !== ASTERISK && from !== id) {
        const [type, address, arg1] = message;
        switch (type) {
          case MessageType.Node: {
            return await receiveNode(address, arg1, from);
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
          await sendNode(address, timestamps, from);
        }
      }
    }

    if (isSubNodes(otherNode)) {
      if (!hasChildren) {
        log(`structure mismatch: ${address}`, 'warn');
      } else {
        let send = false;
        const subNodes: SubNodes = {};

        const otherIds = setNew(objKeys(otherNode));
        const myIds = setNew(await connector.getChildren(address));
        const onlyMyIds = myIds.difference(otherIds);

        await promiseAll(
          arrayMap([...onlyMyIds], async (id) => {
            subNodes[id] = [
              await connector.getTimestamp([...address, id]),
              await connector.get([...address, id]),
            ];
            send = true;
          }),
        );

        await promiseAll(
          arrayMap([...otherIds], async (id) => {
            const otherTimestampOrTimestampAndValue = otherNode[id] as
              | Timestamp
              | TimestampAndValue;

            const myTimestamp = await connector.getTimestamp([...address, id]);
            subNodes[id] = myTimestamp;

            if (isTimestamp(otherTimestampOrTimestampAndValue)) {
              await compareTimestamps(
                otherTimestampOrTimestampAndValue,
                myTimestamp,
                () => {
                  send = true;
                },
                async () => {
                  subNodes[id] = [
                    myTimestamp,
                    await connector.get([...address, id]),
                  ];
                  send = true;
                },
              );
            } else {
              await compareTimestamps(
                otherTimestampOrTimestampAndValue[0],
                myTimestamp,
                async (otherTimestamp) => {
                  log(`set(${address}) from ${from}`);
                  await connector.set(
                    [...address, id],
                    otherTimestampOrTimestampAndValue[1],
                  );
                  await connector.setTimestamp(
                    [...address, id],
                    otherTimestamp,
                  );
                },
                async () => {
                  subNodes[id] = [
                    myTimestamp,
                    await connector.get([...address, id]),
                  ];
                  send = true;
                },
              );
            }
          }),
        );

        if (send) {
          await sendNode(address, subNodes, from);
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
