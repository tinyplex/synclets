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
  let boundSynclet: ProtectedSynclet | undefined;

  const attach = async (synclet: ProtectedSynclet) => {
    if (boundSynclet) {
      errorNew('Meta connector is already attached to Synclet');
    }
    boundSynclet = synclet;
    await connect?.();
  };

  const detach = async () => {
    await disconnect?.();
    boundSynclet = undefined;
  };

  return {
    _brand: 'MetaConnector',
    _: [
      depth,
      attach,
      detach,
      readTimestamp,
      readHash,
      writeTimestamp,
      writeHash,
      readChildIds,
    ],
    $: [getMeta],
  };
};
