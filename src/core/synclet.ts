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
import {arrayMap, getUniqueId} from '@synclets/utils';
import {MessageType} from './message.ts';
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
        await sendHash(await connector.getHash(address));
      } else {
        await sendTimestamp(await connector.getTimestamp(address));
      }
    });

  // #region send

  const sendMessage = transport.sendMessage;

  const sendTimestamp = async (timestamp: Timestamp, to?: string) => {
    log(`send Timestamp to ${to}`);
    await sendMessage([MessageType.Timestamp, timestamp], to);
  };

  const sendTimestampAndValue = async (
    timestamp: Timestamp,
    value: Value,
    to: string,
  ) => {
    log(`send TimestampAndValue to ${to}`);
    await sendMessage([MessageType.TimestampAndValue, timestamp, value], to);
  };

  const sendHash = async (hash: Hash, to?: string) => {
    log(`send Hash to ${to}`);
    await sendMessage([MessageType.Hash, hash]);
  };

  const sendTimestamps = async (
    timestamps: {[id: string]: Timestamp},
    to?: string,
  ) => {
    log(`send Timestamps to ${to}`);
    await sendMessage([MessageType.Timestamps, timestamps], to);
  };

  const sendTimestampsAndValues = async (
    timestampsAndValues: {[id: string]: [Timestamp, Value]},
    needIds: string[],
    to?: string,
  ) => {
    log(`send TimestampsAndValues to ${to}`);
    await sendMessage(
      [MessageType.TimestampsAndValues, timestampsAndValues, needIds],
      to,
    );
  };

  // #endregion

  // #region receive

  const receiveMessage = (message: Message, from: string) =>
    queueIfStarted(async () => {
      if (from !== '*' && from !== id) {
        switch (message[0]) {
          case MessageType.Timestamp: {
            return await receiveTimestamp(message[1], from);
          }
          case MessageType.TimestampAndValue: {
            return await receiveTimestampAndValue(message[1], message[2], from);
          }
          case MessageType.Hash: {
            return await receiveHash(message[1], from);
          }
          case MessageType.Timestamps: {
            return await receiveTimestamps(message[1], from);
          }
          case MessageType.TimestampsAndValues: {
            return await receiveTimestampsAndValues(
              message[1],
              message[2],
              from,
            );
          }
        }
      }
    });

  const receiveTimestamp = async (otherTimestamp: Timestamp, from: string) => {
    log(`recv Timestamp from ${from}`);
    const myTimestamp = await connector.getTimestamp([]);
    if (otherTimestamp > myTimestamp) {
      await sendTimestamp(myTimestamp, from);
    } else if (otherTimestamp < myTimestamp) {
      await sendTimestampAndValue(myTimestamp, await connector.get([]), from);
    }
  };

  const receiveTimestampAndValue = async (
    timestamp: Timestamp,
    value: Value,
    from: string,
  ) => {
    log(`recv TimestampAndValue from ${from}`);
    if (timestamp > (await connector.getTimestamp([]))) {
      log(`set ${value} from ${from}`);
      await connector.set([], value);
      await connector.setTimestamp([], timestamp);
    }
  };

  const receiveHash = async (hash: Hash, from: string) => {
    log(`recv Hash from ${from}`);
    const myHash = await connector.getHash([]);
    if (hash !== myHash) {
      const timestamps: {[id: string]: Timestamp} = {};
      await Promise.all(
        arrayMap(await connector.getChildren([]), async (id) => {
          timestamps[id] = await connector.getTimestamp([id]);
        }),
      );
      await sendTimestamps(timestamps, from);
    }
  };

  const receiveTimestamps = async (
    otherTimestamps: {[id: string]: Timestamp},
    from: string,
  ) => {
    log(`recv Timestamps from ${from}`);
    const otherIds = new Set(Object.keys(otherTimestamps));
    const myIds = new Set(await connector.getChildren([]));

    const bothIds = myIds.intersection(otherIds);
    const onlyMyIds = myIds.difference(otherIds);
    const needIds = otherIds.difference(myIds);

    const timestampsAndValues: {[id: string]: [Timestamp, Value]} = {};

    await Promise.all(
      [...onlyMyIds].map(async (id) => {
        timestampsAndValues[id] = [
          await connector.getTimestamp([id]),
          await connector.get([id]),
        ];
      }),
    );

    await Promise.all(
      [...bothIds].map(async (id) => {
        const otherTimestamp = otherTimestamps[id];
        const myTimestamp = await connector.getTimestamp([id]);
        if (otherTimestamp > myTimestamp) {
          needIds.add(id);
        } else if (otherTimestamp < myTimestamp) {
          timestampsAndValues[id] = [myTimestamp, await connector.get([id])];
        }
      }),
    );

    await sendTimestampsAndValues(timestampsAndValues, [...needIds], from);
  };

  const receiveTimestampsAndValues = async (
    timestampsAndValues: {[id: string]: [Timestamp, Value]},
    needIds: string[],
    from: string,
  ) => {
    log(`recv TimestampsAndValues from ${from}`);
    await Promise.all(
      Object.keys(timestampsAndValues).map(async (id) => {
        const [timestamp, value] = timestampsAndValues[id];
        if (timestamp > (await connector.getTimestamp([id]))) {
          log(`set ${value} from ${from}`);
          await connector.set([id], value);
          await connector.setTimestamp([id], timestamp);
        }
      }),
    );

    if (needIds.length > 0) {
      const neededTimestampsAndValues: {[id: string]: [Timestamp, Value]} = {};
      await Promise.all(
        needIds.map(async (id) => {
          neededTimestampsAndValues[id] = [
            await connector.getTimestamp([id]),
            await connector.get([id]),
          ];
        }),
      );
      await sendTimestampsAndValues(neededTimestampsAndValues, [], from);
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
