import type {
  createDataConnector as createDataConnectorDecl,
  DataConnectorImplementations,
  DataConnectorOptimizations,
} from '@synclets/@types';
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
  {getData}: DataConnectorOptimizations = {},
): Promise<ProtectedDataConnector> => {
  let connected = false;
  let boundSynclet: ProtectedSynclet | undefined;

  const bind = (synclet: ProtectedSynclet) => {
    if (boundSynclet) {
      errorNew('Data connector is already attached to Synclet');
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

    _: [depth, bind, readAtom, writeAtom, removeAtom, readChildIds],
    $: [getData],
  };
};
