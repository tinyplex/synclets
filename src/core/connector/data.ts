import type {
  ConnectorOptions,
  createDataConnector as createDataConnectorDecl,
  DataConnectorImplementations,
  LogLevel,
} from '@synclets/@types';
import {getUniqueId} from '@synclets/utils';
import {errorNew} from '../../common/other.ts';
import {ProtectedDataConnector, ProtectedSynclet} from '../types.js';

export const createDataConnector: typeof createDataConnectorDecl = async (
  depth,
  {
    connect,
    disconnect,
    readAtom,
    writeAtom,
    removeAtom,
    readChildIds,
  }: DataConnectorImplementations,
  options: ConnectorOptions = {},
): Promise<ProtectedDataConnector> => {
  let connected = false;
  let boundSynclet: ProtectedSynclet | undefined;
  let id = options.id ?? getUniqueId();

  const logger = options.logger ?? {};

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[${id}/DC] ${string}`);

  const bind = (synclet: ProtectedSynclet, syncletId: string) => {
    if (boundSynclet) {
      errorNew('Data connector is already attached to Synclet');
    }
    boundSynclet = synclet;
    id = syncletId;
  };

  return {
    log,

    connect: async () => {
      if (!connected) {
        log('connect');
        await connect?.();
        connected = true;
      }
    },

    disconnect: async () => {
      if (connected) {
        log('disconnect');
        await disconnect?.();
        connected = false;
      }
    },

    isConnected: () => connected,

    _: [depth, bind, readAtom, writeAtom, removeAtom, readChildIds],
  };
};
