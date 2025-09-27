import type {
  ConnectorImplementations,
  ConnectorOptions,
  createConnector as createConnectorDecl,
  LogLevel,
} from '@synclets/@types';
import {getUniqueId} from '@synclets/utils';
import {errorNew} from '../common/other.ts';
import {ProtectedConnector, ProtectedSynclet} from './types.js';

export const createConnector: typeof createConnectorDecl = async (
  depth,
  {
    connect,
    disconnect,
    readAtom,
    readTimestamp,
    readHash,
    writeAtom,
    writeTimestamp,
    writeHash,
    removeAtom,
    readChildIds,
  }: ConnectorImplementations,
  options: ConnectorOptions = {},
): Promise<ProtectedConnector> => {
  if (depth < 1) {
    errorNew('depth must be positive');
  }

  let connected = false;
  let boundSynclet: ProtectedSynclet | undefined;
  let id = options.id ?? getUniqueId();

  const logger = options.logger ?? {};

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[${id}/C] ${string}`);

  const bind = (synclet: ProtectedSynclet, syncletId: string) => {
    if (boundSynclet) {
      errorNew('Connector is already attached to Synclet');
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

    _: [
      depth,
      bind,
      readAtom,
      readTimestamp,
      readHash,
      writeAtom,
      writeTimestamp,
      writeHash,
      removeAtom,
      readChildIds,
    ],
  };
};
