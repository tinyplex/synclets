import type {
  createLocalStorageConnectors as createLocalStorageConnectorsDecl,
  createLocalStorageDataConnector as createLocalStorageDataConnectorDecl,
  createLocalStorageMetaConnector as createLocalStorageMetaConnectorDecl,
  LocalStorageDataConnector,
  LocalStorageMetaConnector,
} from '@synclets/@types/connector/browser';
import {createStorageConnector} from './common.ts';

export const createLocalStorageConnectors: typeof createLocalStorageConnectorsDecl =
  <Depth extends number>(
    depth: Depth,
    storageName: string,
    {
      dataStorageName = storageName,
      metaStorageName = storageName,
    }: {dataStorageName?: string; metaStorageName?: string} = {},
  ) => [
    createLocalStorageDataConnector(depth, dataStorageName),
    createLocalStorageMetaConnector(depth, metaStorageName),
  ];

export const createLocalStorageDataConnector: typeof createLocalStorageDataConnectorDecl =
  <Depth extends number>(
    depth: Depth,
    storageName: string,
  ): LocalStorageDataConnector<Depth> =>
    createStorageConnector(true, false, depth, storageName);

export const createLocalStorageMetaConnector: typeof createLocalStorageMetaConnectorDecl =
  <Depth extends number>(
    depth: Depth,
    storageName: string,
  ): LocalStorageMetaConnector<Depth> =>
    createStorageConnector(true, true, depth, storageName);
