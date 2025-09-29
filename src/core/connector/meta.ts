import type {
  createMetaConnector as createMetaConnectorDecl,
  MetaConnectorImplementations,
  MetaConnectorOptimizations,
} from '@synclets/@types';
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
  {getMeta}: MetaConnectorOptimizations = {},
): Promise<ProtectedMetaConnector> => {
  let connected = false;
  let boundSynclet: ProtectedSynclet | undefined;

  const bind = (synclet: ProtectedSynclet) => {
    if (boundSynclet) {
      errorNew('Meta connector is already attached to Synclet');
    }
    boundSynclet = synclet;
  };

  return {
    connect: async () => {
      if (!connected) {
        await connect?.();
        connected = true;
      }
    },

    disconnect: async () => {
      if (connected) {
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
    $: [getMeta],
  };
};
