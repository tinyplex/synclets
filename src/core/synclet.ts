import type {
  Address,
  createSynclet as createSyncletDecl,
  SyncletOptions,
} from '@synclets/@types';
import {getUniqueId, jsonStringify} from '@synclets/utils';
import {buildGiveMessage, buildHaveMessage, MessageType} from './message.ts';
import type {
  Message,
  ProtectedConnector,
  ProtectedSynclet,
  ProtectedTransport,
} from './protected.d.ts';

export const createSynclet: typeof createSyncletDecl = ((
  connector: ProtectedConnector,
  transport: ProtectedTransport,
  options: SyncletOptions = {},
): ProtectedSynclet => {
  let started = false;
  const id = options.id ?? getUniqueId();
  const logger = options.logger;

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

  const log = (message: string) => logger?.(`[${id}] ${message}`);

  const logSlow = (message: () => string) => (logger ? log(message()) : 0);

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

  // #endregion

  const synclet: ProtectedSynclet = {
    __brand: 'Synclet',

    log,
    sync,

    getId,
    getStarted,
    start,
    stop,
  };

  log('createSynclet');
  connector.attachToSynclet(synclet);
  transport.attachToSynclet(synclet);
  return synclet;
}) as any;
