import type {
  createMetaConnector as createMetaConnectorDecl,
  LogLevel,
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
    writeTimestamp,
    readChildIds,
    readTimestamps,
  }: MetaConnectorImplementations,
  {getMeta}: MetaConnectorOptimizations = {},
): Promise<ProtectedMetaConnector> => {
  let attachedSynclet: ProtectedSynclet | undefined;

  const log = (message: string, level?: LogLevel) =>
    attachedSynclet?.log(message, level);

  const attach = async (synclet: ProtectedSynclet) => {
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

  return {
    _brand: 'MetaConnector',
    log,
    _: [
      depth,
      attach,
      detach,
      readTimestamp,
      writeTimestamp,
      readChildIds,
      readTimestamps,
    ],
    $: [getMeta],
  };
};
