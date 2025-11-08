/// connector/browser

import type {DataConnector, MetaConnector} from '../../index.js';

/// LocalStorageDataConnector
export interface LocalStorageDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  getStorageName(): string;
}

/// createLocalStorageDataConnector
export function createLocalStorageDataConnector<Depth extends number>(
  depth: Depth,
  storageName: string,
): LocalStorageDataConnector<Depth>;

/// LocalStorageMetaConnector
export interface LocalStorageMetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  getStorageName(): string;
}

/// createLocalStorageMetaConnector
export function createLocalStorageMetaConnector<Depth extends number>(
  depth: Depth,
  storageName: string,
): LocalStorageMetaConnector<Depth>;

/// SessionStorageDataConnector
export interface SessionStorageDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  getStorageName(): string;
}

/// createSessionStorageDataConnector
export function createSessionStorageDataConnector<Depth extends number>(
  depth: Depth,
  storageName: string,
): SessionStorageDataConnector<Depth>;

/// SessionStorageMetaConnector
export interface SessionStorageMetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  getStorageName(): string;
}

/// createSessionStorageMetaConnector
export function createSessionStorageMetaConnector<Depth extends number>(
  depth: Depth,
  storageName: string,
): SessionStorageMetaConnector<Depth>;
