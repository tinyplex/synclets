import type {
  Atom,
  AtomAddress,
  createDataConnector as createDataConnectorDecl,
  DataConnectorImplementations,
  DataConnectorOptimizations,
  DataConnectorOptions,
  ExtraMethods,
  LogLevel,
} from '@synclets/@types';
import {objFreeze} from '../../common/object.ts';
import {errorNew} from '../../common/other.ts';
import {ProtectedDataConnector, ProtectedSynclet} from '../types.ts';

const SYNC_CHANGED_ATOMS = 0;

export const createDataConnector: typeof createDataConnectorDecl = <
  Depth extends number,
>(
  {depth}: DataConnectorOptions<Depth>,
  {
    connect,
    disconnect,
    readAtom,
    writeAtom: writeAtomImpl,
    removeAtom: removeAtomImpl,
    readChildIds,
  }: DataConnectorImplementations<Depth>,
  {readAtoms, getData}: DataConnectorOptimizations<Depth> = {},
  extraMethods: ExtraMethods = {},
): ProtectedDataConnector<Depth> => {
  let attachedSynclet: ProtectedSynclet<Depth> | undefined;
  let syncletWriting = 0;

  const log = (message: string, level?: LogLevel) =>
    attachedSynclet?.log(message, level);

  const syncChangedAtoms = async (...addresses: AtomAddress<Depth>[]) => {
    if (!syncletWriting) {
      await attachedSynclet?._[SYNC_CHANGED_ATOMS](...addresses);
    }
  };

  const writeAtom = async (address: AtomAddress<Depth>, atom: Atom) => {
    syncletWriting = 1;
    await writeAtomImpl(address, atom);
    syncletWriting = 0;
  };

  const removeAtom = async (address: AtomAddress<Depth>) => {
    syncletWriting = 1;
    await removeAtomImpl(address);
    syncletWriting = 0;
  };

  const attach = async (synclet: ProtectedSynclet<Depth>) => {
    if (attachedSynclet) {
      errorNew('Data connector is already attached to Synclet');
    }
    attachedSynclet = synclet;
    await connect?.(syncChangedAtoms);
  };

  const detach = async () => {
    await disconnect?.();
    attachedSynclet = undefined;
  };

  return objFreeze({
    ...extraMethods,
    _brand: 'DataConnector',
    depth,
    log,
    _: [attach, detach, readAtom, writeAtom, removeAtom, readChildIds],
    $: [readAtoms, getData],
  }) as ProtectedDataConnector<Depth>;
};
