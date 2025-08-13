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
  jsonStringify,
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

  const sendMessage = async (
    address: Address,
    node: Node,
    to?: string,
    partial: 0 | 1 = 0,
  ) => await transport.sendMessage([address, node, partial], to);

  // #endregion

  // #region receive

  const receiveMessage = (message: Message, from: string) =>
    queueIfStarted(async () => {
      if (from !== ASTERISK && from !== id) {
        const [address, node, partial = 0] = message;
        if (await connector.hasChildren(address)) {
          if (isHash(node)) {
            log(`recv Hash(${address}) from ${from}`);
            return receiveHash(address, node, from);
          }
          if (isSubNodes(node)) {
            log(`recv SubNodes(${address}) from ${from}`);
            return receiveSubNodes(address, node, partial, from);
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
      await sendMessage(address, await buildSubNodes(address), from);
    }
  };

  const buildSubNodes = async (address: Address) => {
    const subNodes: {[id: string]: Timestamp | Hash} = {};
    await promiseAll(
      arrayMap(await connector.getChildren(address), async (id) => {
        const subAddress = [...address, id];
        subNodes[id] =
          await connector[
            (await connector.hasChildren(subAddress))
              ? 'getHash'
              : 'getTimestamp'
          ](subAddress);
      }),
    );
    return subNodes;
  };

  const receiveSubNodes = async (
    address: Address,
    otherSubNodes: SubNodes,
    partial: 0 | 1,
    from: string,
  ) => {
    const subNodes: SubNodes = {};
    const otherIds = objKeys(otherSubNodes);

    if (!partial) {
      await promiseAll(
        arrayMap(
          arrayDifference(await connector.getChildren(address), otherIds),
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
      arrayMap(otherIds, async (id) => {
        const otherSubNode = otherSubNodes[id] as
          | Timestamp
          | TimestampAndValue
          | Hash;
        const subAddress = [...address, id];

        if (isHash(otherSubNode)) {
          log('isHash(otherSubNode)');
          if ((await connector.getHash(subAddress)) != otherSubNode) {
            subNodes[id] = await buildSubNodes(subAddress);
          } else {
            partial = 1;
          }
        } else {
          const otherIsTimestamp = isTimestamp(otherSubNode);
          const otherTimestamp = otherIsTimestamp
            ? otherSubNode
            : otherSubNode[0];

          const myTimestamp = await connector.getTimestamp(subAddress);

          if (otherTimestamp > myTimestamp) {
            if (otherIsTimestamp) {
              subNodes[id] = myTimestamp;
            } else {
              await connector.setTimestampAndValue(subAddress, ...otherSubNode);
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
        }
      }),
    );

    log(jsonStringify(subNodes));
    if (objNotEmpty(subNodes)) {
      await sendMessage(address, subNodes, from, partial);
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
