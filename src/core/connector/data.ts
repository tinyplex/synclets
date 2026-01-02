import type {
  Atom,
  AtomAddress,
  createDataConnector as createDataConnectorDecl,
  DataConnectorImplementations,
  DataConnectorOptimizations,
  DataConnectorOptions,
  ExtraMembers,
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
    attach: attachImpl,
    detach: detachImpl,
    readAtom,
    writeAtom: writeAtomImpl,
    removeAtom: removeAtomImpl,
    readChildIds,
  }: DataConnectorImplementations<Depth>,
  {readAtoms, getData}: DataConnectorOptimizations<Depth> = {},
  extraMembers: ExtraMembers = {},
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
    await attachImpl?.(syncChangedAtoms);
  };

  const detach = async () => {
    await detachImpl?.();
    attachedSynclet = undefined;
  };

  return objFreeze({
    ...extraMembers,
    _brand: 'DataConnector',
    depth,
    log,
    _: [attach, detach, readAtom, writeAtom, removeAtom, readChildIds],
    $: [readAtoms, getData],
  }) as ProtectedDataConnector<Depth>;
};
