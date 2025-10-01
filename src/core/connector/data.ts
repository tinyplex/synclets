import type {
  createDataConnector as createDataConnectorDecl,
  DataConnectorImplementations,
  DataConnectorOptimizations,
  LogLevel,
} from '@synclets/@types';
import {errorNew} from '../../common/other.ts';
import {ProtectedDataConnector, ProtectedSynclet} from '../types.js';

export const createDataConnector: typeof createDataConnectorDecl = async <
  Depth extends number,
>(
  depth: Depth,
  {
    connect,
    disconnect,
    readAtom,
    writeAtom,
    removeAtom,
    readChildIds,
    readAtoms,
  }: DataConnectorImplementations<Depth>,
  {getData}: DataConnectorOptimizations = {},
): Promise<ProtectedDataConnector<Depth>> => {
  let attachedSynclet: ProtectedSynclet<Depth> | undefined;

  const log = (message: string, level?: LogLevel) =>
    attachedSynclet?.log(message, level);

  const attach = async (synclet: ProtectedSynclet<Depth>) => {
    if (attachedSynclet) {
      errorNew('Data connector is already attached to Synclet');
    }
    attachedSynclet = synclet;
    await connect?.();
  };

  const detach = async () => {
    await disconnect?.();
    attachedSynclet = undefined;
  };

  return {
    _brand: 'DataConnector',
    depth,
    log,
    _: [
      attach,
      detach,
      readAtom,
      writeAtom,
      removeAtom,
      readChildIds,
      readAtoms,
    ],
    $: [getData],
  };
};
