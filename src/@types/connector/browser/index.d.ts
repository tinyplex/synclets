/// connector/browser

import type {Connectors, DataConnector, MetaConnector} from '../../index.js';

export type {Connectors};

/// LocalStorageDataConnector
export interface LocalStorageDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  /// LocalStorageDataConnector.getStorageName
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
  /// LocalStorageMetaConnector.getStorageName
  getStorageName(): string;
}

/// createLocalStorageMetaConnector
export function createLocalStorageMetaConnector<Depth extends number>(
  depth: Depth,
  storageName: string,
): LocalStorageMetaConnector<Depth>;

/// createLocalStorageConnectors
export function createLocalStorageConnectors<Depth extends number>(
  depth: Depth,
  dataStorageName: string,
  metaStorageName: string,
): Connectors<
  Depth,
  LocalStorageDataConnector<Depth>,
  LocalStorageMetaConnector<Depth>
>;

/// SessionStorageDataConnector
export interface SessionStorageDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  /// SessionStorageDataConnector.getStorageName
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
  /// SessionStorageMetaConnector.getStorageName
  getStorageName(): string;
}

/// createSessionStorageMetaConnector
export function createSessionStorageMetaConnector<Depth extends number>(
  depth: Depth,
  storageName: string,
): SessionStorageMetaConnector<Depth>;

/// createSessionStorageConnectors
export function createSessionStorageConnectors<Depth extends number>(
  depth: Depth,
  dataStorageName: string,
  metaStorageName: string,
): Connectors<
  Depth,
  SessionStorageDataConnector<Depth>,
  SessionStorageMetaConnector<Depth>
>;
