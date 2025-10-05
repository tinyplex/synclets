import type {
  createMetaConnector as createMetaConnectorDecl,
  LogLevel,
  MetaConnectorImplementations,
  MetaConnectorOptimizations,
} from '@synclets/@types';
import {objFreeze} from '../../common/object.ts';
import {errorNew} from '../../common/other.ts';
import {ProtectedMetaConnector, ProtectedSynclet} from '../types.js';

export const createMetaConnector: typeof createMetaConnectorDecl = async <
  Depth extends number,
>(
  depth: Depth,
  {
    connect,
    disconnect,
    readTimestamp,
    writeTimestamp,
    readChildIds,
    readTimestamps,
  }: MetaConnectorImplementations<Depth>,
  {getMeta}: MetaConnectorOptimizations = {},
): Promise<ProtectedMetaConnector<Depth>> => {
  let attachedSynclet: ProtectedSynclet<Depth> | undefined;

  const log = (message: string, level?: LogLevel) =>
    attachedSynclet?.log(message, level);

  const attach = async (synclet: ProtectedSynclet<Depth>) => {
    if (attachedSynclet) {
      errorNew('Meta connector is already attached to Synclet');
    }
    attachedSynclet = synclet;
    await connect?.();
  };

  const detach = async () => {
    await disconnect?.();
    attachedSynclet = undefined;
  };

  return objFreeze({
    _brand: 'MetaConnector',
    depth,
    log,
    _: [
      attach,
      detach,
      readTimestamp,
      writeTimestamp,
      readChildIds,
      readTimestamps,
    ],
    $: [getMeta],
  }) as ProtectedMetaConnector<Depth>;
};
