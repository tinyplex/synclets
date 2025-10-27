/// connector/browser

import type {DataConnector, MetaConnector} from '../../index.js';

export interface LocalStorageDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  getStorageName(): string;
}

export function createLocalStorageDataConnector<Depth extends number>(
  depth: Depth,
  storageName: string,
): LocalStorageDataConnector<Depth>;

export interface LocalStorageMetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  getStorageName(): string;
}

export function createLocalStorageMetaConnector<Depth extends number>(
  depth: Depth,
  storageName: string,
): LocalStorageMetaConnector<Depth>;

export interface SessionStorageDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  getStorageName(): string;
}

export function createSessionStorageDataConnector<Depth extends number>(
  depth: Depth,
  storageName: string,
): SessionStorageDataConnector<Depth>;

export interface SessionStorageMetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  getStorageName(): string;
}

export function createSessionStorageMetaConnector<Depth extends number>(
  depth: Depth,
  storageName: string,
): SessionStorageMetaConnector<Depth>;
