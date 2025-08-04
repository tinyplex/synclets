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

export const createSynclet: typeof createSyncletDecl = ((
  connector: ProtectedConnector,
  transport: ProtectedTransport,
  options: SyncletOptions = {},
): Synclet => {
  let started = false;
  const id = options.id ?? getUniqueId();
  const logger = options.logger ?? {};

  const ifStarted = async (actions: () => Promise<void>) => {
    if (started) {
      await actions();
    }
  };

  const receiveMessage = async (message: Message) =>
    ifStarted(async () => {
      logSlow(() => `receive: ${jsonStringify(message)}`);
      const {type, address, timestamp, hash, from} = message;
      const myHash = await connector.getHash(address);
      if (myHash !== hash) {
        if (type === MessageType.Have) {
          const myTimestamp = await connector.getTimestamp(address);
          if (timestamp > myTimestamp) {
            await sendMessage(
              buildHaveMessage(address, myTimestamp, myHash, from),
            );
          } else if (timestamp < myTimestamp) {
            const myValue = await connector.get(address);
            await sendMessage(
              buildGiveMessage(address, myValue, myTimestamp, myHash, from),
            );
          }
        } else if (type === MessageType.Give) {
          const {address, value, timestamp, hash} = message;
          await connector.set(address, value);
          await connector.setTimestamp(address, timestamp);
          await connector.setHash(address, hash);
        }
      }
    });

  const sendMessage = async (message: Message) =>
    ifStarted(async () => {
      logSlow(() => `send: ${jsonStringify(message)}`);
      await transport.sendMessage(message);
    });

  // #region protected

  const sync = async (address: Address) =>
    ifStarted(async () => {
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
