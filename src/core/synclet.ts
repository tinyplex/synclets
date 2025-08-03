import type {
  Address,
  createSynclet as createSyncletDecl,
  SyncletOptions,
} from '@synclets/@types';
import {getUniqueId, jsonStringify} from '@synclets/utils';
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

  const ifStarted = async (
    actions: () => Promise<(() => string) | undefined>,
  ) => {
    if (started) {
      const getLog = await actions();
      if (getLog && logger) {
        log(getLog());
      }
    }
  };

  const receiveMessage = async (message: Message) =>
    ifStarted(async () => {
      const {address, node} = message;
      await connector.setNode(address, node);
      return () => `receive: ${jsonStringify(message)}`;
    });

  const sendMessage = async (message: Message) =>
    ifStarted(async () => {
      await transport.sendMessage(message);
      return () => `send: ${jsonStringify(message)}`;
    });

  // #region protected

  const log = (message: string) => logger?.(`[${id}] ${message}`);

  const sync = async (address: Address) =>
    ifStarted(async () => {
      await sendMessage({address, node: await connector.getNode(address)});
      return () => `sync: ${jsonStringify(address)}`;
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
