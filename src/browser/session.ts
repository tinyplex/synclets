import {createSynclet} from '@synclets';
import type {
  createSessionStorageDataConnector as createSessionStorageDataConnectorDecl,
  createSessionStorageMetaConnector as createSessionStorageMetaConnectorDecl,
  createSessionStorageSynclet as createSessionStorageSyncletDecl,
} from '@synclets/@types/browser';
import {createStorageConnector} from './common.ts';

export const createSessionStorageDataConnector: typeof createSessionStorageDataConnectorDecl =
  ({depth, dataStorageName}) =>
    createStorageConnector(false, false, depth, dataStorageName);

export const createSessionStorageMetaConnector: typeof createSessionStorageMetaConnectorDecl =
  ({depth, metaStorageName}) =>
    createStorageConnector(false, true, depth, metaStorageName);

export const createSessionStorageSynclet: typeof createSessionStorageSyncletDecl =
  async ({
    depth,
    dataStorageName,
    metaStorageName,
    transport,
    implementations,
    id,
    logger,
  }) =>
    await createSynclet(
      {
        dataConnector: createSessionStorageDataConnector({
          depth,
          dataStorageName,
        }),
        metaConnector: createSessionStorageMetaConnector({
          depth,
          metaStorageName,
        }),
        transport,
      },
      implementations,
      {id, logger},
    );
