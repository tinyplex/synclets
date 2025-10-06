import type {
  createDataConnector as createDataConnectorDecl,
  DataConnectorImplementations,
  DataConnectorOptimizations,
  LogLevel,
} from '@synclets/@types';
import {objFreeze} from '../../common/object.ts';
import {errorNew} from '../../common/other.ts';
import {ProtectedDataConnector, ProtectedSynclet} from '../types.js';

export const createDataConnector: typeof createDataConnectorDecl = <
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
  }: DataConnectorImplementations<Depth>,
  {readAtoms, getData}: DataConnectorOptimizations<Depth> = {},
): ProtectedDataConnector<Depth> => {
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

  return objFreeze({
    _brand: 'DataConnector',
    depth,
    log,
    _: [attach, detach, readAtom, writeAtom, removeAtom, readChildIds],
    $: [readAtoms, getData],
  }) as ProtectedDataConnector<Depth>;
};
