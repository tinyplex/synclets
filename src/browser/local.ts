import {createSynclet} from '@synclets';
import type {
  createLocalStorageDataConnector as createLocalStorageDataConnectorDecl,
  createLocalStorageMetaConnector as createLocalStorageMetaConnectorDecl,
  createLocalStorageSynclet as createLocalStorageSyncletDecl,
  LocalStorageSyncletOptions,
} from '@synclets/@types/browser';
import {createStorageConnector} from './common.ts';

export const createLocalStorageDataConnector: typeof createLocalStorageDataConnectorDecl =
  ({depth, dataStorageName}) =>
    createStorageConnector(true, false, depth, dataStorageName);

export const createLocalStorageMetaConnector: typeof createLocalStorageMetaConnectorDecl =
  ({depth, metaStorageName}) =>
    createStorageConnector(true, true, depth, metaStorageName);

export const createLocalStorageSynclet: typeof createLocalStorageSyncletDecl = <
  Depth extends number,
>({
  depth,
  dataStorageName,
  metaStorageName,
  transport,
  implementations,
  id,
  logger,
}: LocalStorageSyncletOptions<Depth>) =>
  createSynclet(
    {
      dataConnector: createLocalStorageDataConnector({depth, dataStorageName}),
      metaConnector: createLocalStorageMetaConnector({depth, metaStorageName}),
      transport,
    },
    implementations,
    {id, logger},
  );
