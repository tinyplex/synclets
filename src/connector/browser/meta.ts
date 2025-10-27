import type {
  createLocalStorageMetaConnector as createLocalStorageMetaConnectorDecl,
  createSessionStorageMetaConnector as createSessionStorageMetaConnectorDecl,
  LocalStorageMetaConnector,
  SessionStorageMetaConnector,
} from '@synclets/@types/connector/browser';
import {createStorageConnector} from './common.ts';

export const createLocalStorageMetaConnector: typeof createLocalStorageMetaConnectorDecl =
  <Depth extends number>(
    depth: Depth,
    storageName: string,
  ): LocalStorageMetaConnector<Depth> =>
    createStorageConnector(true, true, depth, storageName);

export const createSessionStorageMetaConnector: typeof createSessionStorageMetaConnectorDecl =
  <Depth extends number>(
    depth: Depth,
    storageName: string,
  ): SessionStorageMetaConnector<Depth> =>
    createStorageConnector(false, true, depth, storageName);
