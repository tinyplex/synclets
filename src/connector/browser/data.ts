import type {
  createLocalStorageDataConnector as createLocalStorageDataConnectorDecl,
  createSessionStorageDataConnector as createSessionStorageDataConnectorDecl,
  LocalStorageDataConnector,
  SessionStorageDataConnector,
} from '@synclets/@types/connector/browser';
import {createStorageConnector} from './common.ts';

export const createLocalStorageDataConnector: typeof createLocalStorageDataConnectorDecl =
  <Depth extends number>(
    depth: Depth,
    storageName: string,
  ): LocalStorageDataConnector<Depth> =>
    createStorageConnector(true, false, depth, storageName);

export const createSessionStorageDataConnector: typeof createSessionStorageDataConnectorDecl =
  <Depth extends number>(
    depth: Depth,
    storageName: string,
  ): SessionStorageDataConnector<Depth> =>
    createStorageConnector(false, false, depth, storageName);
