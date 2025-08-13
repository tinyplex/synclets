import type {
  Address,
  createSynclet as createSyncletDecl,
  LogLevel,
  Node,
  SubNodes,
  Synclet,
  SyncletOptions,
  Timestamp,
  TimestampAndValue,
} from '@synclets/@types';
import {
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
  setNew,
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
    await sendMessage([address, node, partial], to);
  };

  // #endregion

  // #region receive

  const receiveMessage = (message: Message, from: string) =>
    queueIfStarted(async () => {
      if (from !== ASTERISK && from !== id) {
        const [address, node, partial = 0] = message;
        return await receiveNode(address, node, partial, from);
      }
    });

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
          await connector.setTimestampAndValue(
            address,
            otherTimestamp,
            otherValue,
          );
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
                subNodes[id] = await connector.getTimestampAndValue([
                  ...address,
                  id,
                ]);
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
                await connector.setTimestampAndValue(
                  subAddress,
                  ...otherSubNode,
                );
              }
            } else if (otherTimestamp < myTimestamp) {
              subNodes[id] = await connector.getTimestampAndValue(
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
