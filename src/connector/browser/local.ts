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
    dataStorageName: string,
    metaStorageName: string,
  ) => {
    const dataConnector = createLocalStorageDataConnector(
      depth,
      dataStorageName,
    );
    const metaConnector = createLocalStorageMetaConnector(
      depth,
      metaStorageName,
    );
    return {
      getDataConnector: () => dataConnector,
      getMetaConnector: () => metaConnector,
    };
  };

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
