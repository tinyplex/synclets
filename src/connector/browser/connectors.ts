import type {
  createLocalStorageConnectors as createLocalStorageConnectorsDecl,
  createSessionStorageConnectors as createSessionStorageConnectorsDecl,
} from '@synclets/@types/connector/browser';
import {
  createLocalStorageDataConnector,
  createSessionStorageDataConnector,
} from './data.ts';
import {
  createLocalStorageMetaConnector,
  createSessionStorageMetaConnector,
} from './meta.ts';

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
