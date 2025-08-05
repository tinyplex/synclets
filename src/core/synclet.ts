import type {
  Address,
  createSynclet as createSyncletDecl,
  LogLevel,
  Synclet,
  SyncletOptions,
} from '@synclets/@types';
import {getUniqueId, jsonStringify} from '@synclets/utils';
import {buildGiveMessage, buildHaveMessage, MessageType} from './message.ts';
import type {
  Message,
  ProtectedConnector,
  ProtectedTransport,
} from './protected.d.ts';
import {getQueue} from './queue.ts';

export const createSynclet: typeof createSyncletDecl = ((
  connector: ProtectedConnector,
  transport: ProtectedTransport,
  options: SyncletOptions = {},
): Synclet => {
  let started = false;

  const id = options.id ?? getUniqueId();
  const logger = options.logger ?? {};
  const queue = getQueue();

  const queueIfStarted = async (actions: () => Promise<void>) => {
    if (started) {
      await queue(actions);
    }
  };

  const receiveMessage = (message: Message, from: string) =>
    queueIfStarted(async () => {
      const {type, address, timestamp, hash} = message;
      const myHash = await connector.getHash(address);
      if (myHash !== hash && from && from !== '*' && from !== id) {
        if (type === MessageType.Have) {
          logSlow(() => `recv HAVE ${jsonStringify(address)} from ${from}`);
          const myTimestamp = await connector.getTimestamp(address);

          if (timestamp > myTimestamp) {
            logSlow(() => `send HAVE ${jsonStringify(address)} to ${from}`);

            await sendMessage(
              buildHaveMessage(address, myTimestamp, myHash),
              from,
            );
          } else {
            logSlow(() => `send GIVE ${jsonStringify(address)} to ${from}`);

            const myValue = await connector.get(address);
            await sendMessage(
              buildGiveMessage(address, myValue, myTimestamp, myHash),
              from,
            );
          }
        } else if (type === MessageType.Give) {
          logSlow(() => `recv GIVE ${jsonStringify(address)} from ${from}`);

          if (timestamp > (await connector.getTimestamp(address))) {
            logSlow(() => `set ${jsonStringify(address)} from ${from}`);
            await connector.setTimestamp(address, timestamp);
            await connector.set(address, message.value);
            await connector.setHash(address, hash);
          }
        }
      }
    });

  const sendMessage = (message: Message, to?: string) =>
    queueIfStarted(async () => {
      await transport.sendMessage(message, to);
    });

  // #region protected

  const sync = (address: Address) =>
    queueIfStarted(async () => {
      logSlow(() => `sync: ${jsonStringify(address)}`);

      await sendMessage(
        buildHaveMessage(
          address,
          await connector.getTimestamp(address),
          await connector.getHash(address),
        ),
      );
    });

  const logSlow = (getString: () => string, level: LogLevel = 'info') =>
    logger ? log(getString(), level) : 0;

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
    start,
    stop,
    log,
  };

  log('createSynclet');
  connector.attachToSynclet(synclet);
  transport.attachToSynclet(synclet);
  return synclet;
}) as any;
