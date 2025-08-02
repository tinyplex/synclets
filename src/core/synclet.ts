import type {
  Address,
  createSynclet as createSyncletDecl,
  SyncletOptions,
} from '@synclets/@types';
import {getUniqueId} from '@synclets/utils';
import type {
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
  const logger = options.logger ?? (() => {});

  const ifStarted = async (actions: () => Promise<void>, logString: string) => {
    if (started) {
      log(logString);
      await actions();
    }
  };

  // #region protected

  const log = (message: string) => logger(`[${id}] ${message}`);

  const changed = async (address: Address) =>
    ifStarted(
      async () =>
        await send(
          JSON.stringify({
            address,
            node: await connector.getNode(address),
          }),
        ),
      `changed: ${address}`,
    );

  const send = async (message: string) =>
    ifStarted(() => transport.send(message), `send: ${message}`);

  const receive = async (message: string) =>
    ifStarted(async () => {
      const {address, node} = JSON.parse(message);
      if (address && node) {
        await connector.setNode(address, node);
      }
    }, `receive: ${message}`);

  // #endregion

  // #region public

  const getId = () => id;

  const getStarted = () => started;

  const start = async () => {
    log('start');
    await connector.connect(changed);
    await transport.connect(receive);
    started = true;
    await changed([]);
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
    changed,
    send,
    receive,

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
