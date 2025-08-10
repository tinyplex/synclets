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
  promiseAll,
} from '@synclets/utils';
import {MessageType} from './message.ts';
import type {
  Message,
  ProtectedConnector,
  ProtectedTransport,
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
        await sendHash(address, await connector.getHash(address));
      } else {
        await sendTimestamp(address, await connector.getTimestamp(address));
      }
    });

  // #region send

  const sendMessage = transport.sendMessage;

  const sendTimestamp = async (
    address: Address,
    timestamp: Timestamp,
    to?: string,
  ) => {
    log(`send Timestamp(${address}) to ${to}`);
    await sendMessage([MessageType.Timestamp, address, timestamp], to);
  };

  const sendTimestampAndValue = async (
    address: Address,
    timestamp: Timestamp,
    value: Value,
    to: string,
  ) => {
    log(`send TimestampAndValue(${address}) to ${to}`);
    await sendMessage(
      [MessageType.TimestampAndValue, address, timestamp, value],
      to,
    );
  };

  const sendHash = async (address: Address, hash: Hash, to?: string) => {
    log(`send Hash(${address}) to ${to}`);
    await sendMessage([MessageType.Hash, address, hash]);
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
          case MessageType.Timestamp: {
            return await receiveTimestamp(address, arg1, from);
          }
          case MessageType.TimestampAndValue: {
            return await receiveTimestampAndValue(address, arg1, arg2, from);
          }
          case MessageType.Hash: {
            return await receiveHash(address, arg1, from);
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

  const receiveTimestamp = async (
    address: Address,
    otherTimestamp: Timestamp,
    from: string,
  ) => {
    log(`recv Timestamp(${address}) from ${from}`);
    await compareTimestamps(
      otherTimestamp,
      await connector.getTimestamp(address),
      (_, myTimestamp) => sendTimestamp(address, myTimestamp, from),
      async (myTimestamp) =>
        await sendTimestampAndValue(
          address,
          myTimestamp,
          await connector.get(address),
          from,
        ),
    );
  };

  const receiveTimestampAndValue = async (
    address: Address,
    otherTimestamp: Timestamp,
    otherValue: Value,
    from: string,
  ) => {
    log(`recv TimestampAndValue(${address}) from ${from}`);
    await compareTimestamps(
      otherTimestamp,
      await connector.getTimestamp(address),
      async () => {
        log(`set(${address}) from ${from}`);
        await connector.set(address, otherValue);
        await connector.setTimestamp(address, otherTimestamp);
      },
    );
  };

  const receiveHash = async (
    address: Address,
    otherHash: Hash,
    from: string,
  ) => {
    log(`recv Hash(${address}) from ${from}`);
    const myHash = await connector.getHash(address);
    if (otherHash !== myHash) {
      const timestamps: {[id: string]: Timestamp} = {};
      await promiseAll(
        arrayMap(await connector.getChildren(address), async (id) => {
          timestamps[id] = await connector.getTimestamp([...address, id]);
        }),
      );
      await sendTimestamps(address, timestamps, from);
    }
  };

  const receiveTimestamps = async (
    address: Address,
    otherTimestamps: {[id: string]: Timestamp},
    from: string,
  ) => {
    log(`recv Timestamps(${address}) from ${from}`);
    const otherIds = new Set(Object.keys(otherTimestamps));
    const myIds = new Set(await connector.getChildren(address));

    const bothIds = [...myIds.intersection(otherIds)];
    const onlyMyIds = [...myIds.difference(otherIds)];
    const needIds = [...otherIds.difference(myIds)];

    const timestampsAndValues: {[id: string]: [Timestamp, Value]} = {};

    await promiseAll(
      onlyMyIds.map(async (id) => {
        timestampsAndValues[id] = [
          await connector.getTimestamp([...address, id]),
          await connector.get([...address, id]),
        ];
      }),
    );

    await promiseAll(
      bothIds.map(async (id) => {
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
      Object.keys(otherTimestampsAndValues).map(
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
      needIds.map(async (id) => {
        neededTimestampsAndValues[id] = [
          await connector.getTimestamp([...address, id]),
          await connector.get([...address, id]),
        ];
      }),
    );
    if (Object.keys(neededTimestampsAndValues).length > 0) {
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
