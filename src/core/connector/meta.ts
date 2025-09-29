import type {
  ConnectorOptions,
  createMetaConnector as createMetaConnectorDecl,
  LogLevel,
  MetaConnectorImplementations,
} from '@synclets/@types';
import {getUniqueId} from '@synclets/utils';
import {errorNew} from '../../common/other.ts';
import {ProtectedMetaConnector, ProtectedSynclet} from '../types.js';

export const createMetaConnector: typeof createMetaConnectorDecl = async (
  depth,
  {
    connect,
    disconnect,
    readTimestamp,
    readHash,
    writeTimestamp,
    writeHash,
    readChildIds,
  }: MetaConnectorImplementations,
  options: ConnectorOptions = {},
): Promise<ProtectedMetaConnector> => {
  let connected = false;
  let boundSynclet: ProtectedSynclet | undefined;
  let id = options.id ?? getUniqueId();

  const logger = options.logger ?? {};

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[${id}/MC] ${string}`);

  const bind = (synclet: ProtectedSynclet, syncletId: string) => {
    if (boundSynclet) {
      errorNew('Meta connector is already attached to Synclet');
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
      readTimestamp,
      readHash,
      writeTimestamp,
      writeHash,
      readChildIds,
    ],
  };
};
