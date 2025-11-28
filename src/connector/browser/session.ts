import type {
  createSessionStorageConnectors as createSessionStorageConnectorsDecl,
  createSessionStorageDataConnector as createSessionStorageDataConnectorDecl,
  createSessionStorageMetaConnector as createSessionStorageMetaConnectorDecl,
  SessionStorageDataConnector,
  SessionStorageMetaConnector,
} from '@synclets/@types/connector/browser';
import {createStorageConnector} from './common.ts';

export const createSessionStorageConnectors: typeof createSessionStorageConnectorsDecl =
  <Depth extends number>(
    depth: Depth,
    storageName: string,
    {
      dataStorageName = storageName,
      metaStorageName = storageName,
    }: {dataStorageName?: string; metaStorageName?: string} = {},
  ) => [
    createSessionStorageDataConnector(depth, dataStorageName),
    createSessionStorageMetaConnector(depth, metaStorageName),
  ];

export const createSessionStorageDataConnector: typeof createSessionStorageDataConnectorDecl =
  <Depth extends number>(
    depth: Depth,
    storageName: string,
  ): SessionStorageDataConnector<Depth> =>
    createStorageConnector(false, false, depth, storageName);

export const createSessionStorageMetaConnector: typeof createSessionStorageMetaConnectorDecl =
  <Depth extends number>(
    depth: Depth,
    storageName: string,
  ): SessionStorageMetaConnector<Depth> =>
    createStorageConnector(false, true, depth, storageName);
