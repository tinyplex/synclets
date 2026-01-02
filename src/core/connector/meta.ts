import type {
  createMetaConnector as createMetaConnectorDecl,
  ExtraMembers,
  LogLevel,
  MetaConnectorImplementations,
  MetaConnectorOptimizations,
  MetaConnectorOptions,
} from '@synclets/@types';
import {objFreeze} from '../../common/object.ts';
import {errorNew} from '../../common/other.ts';
import {ProtectedMetaConnector, ProtectedSynclet} from '../types.ts';

export const createMetaConnector: typeof createMetaConnectorDecl = <
  Depth extends number,
>(
  {depth}: MetaConnectorOptions<Depth>,
  {
    attach: attachImpl,
    detach: detachImpl,
    readTimestamp,
    writeTimestamp,
    readChildIds,
  }: MetaConnectorImplementations<Depth>,
  {readTimestamps, getMeta}: MetaConnectorOptimizations<Depth> = {},
  extraMembers: ExtraMembers = {},
): ProtectedMetaConnector<Depth> => {
  let attachedSynclet: ProtectedSynclet<Depth> | undefined;

  const log = (message: string, level?: LogLevel) =>
    attachedSynclet?.log(message, level);

  const attach = async (synclet: ProtectedSynclet<Depth>) => {
    if (attachedSynclet) {
      errorNew('Meta connector is already attached to Synclet');
    }
    attachedSynclet = synclet;
    await attachImpl?.();
  };

  const detach = async () => {
    await detachImpl?.();
    attachedSynclet = undefined;
  };

  return objFreeze({
    ...extraMembers,
    _brand: 'MetaConnector',
    depth,
    log,
    _: [attach, detach, readTimestamp, writeTimestamp, readChildIds],
    $: [readTimestamps, getMeta],
  }) as ProtectedMetaConnector<Depth>;
};
