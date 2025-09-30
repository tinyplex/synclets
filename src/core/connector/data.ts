import type {
  createDataConnector as createDataConnectorDecl,
  DataConnectorImplementations,
  DataConnectorOptimizations,
  LogLevel,
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
  let boundSynclet: ProtectedSynclet | undefined;

  const log = (message: string, level?: LogLevel) =>
    boundSynclet?.log(message, level);

  const attach = async (synclet: ProtectedSynclet) => {
    if (boundSynclet) {
      errorNew('Data connector is already attached to Synclet');
    }
    boundSynclet = synclet;
    await connect?.();
  };

  const detach = async () => {
    await disconnect?.();
    boundSynclet = undefined;
  };

  return {
    _brand: 'DataConnector',
    log,
    _: [depth, attach, detach, readAtom, writeAtom, removeAtom, readChildIds],
    $: [getData],
  };
};
