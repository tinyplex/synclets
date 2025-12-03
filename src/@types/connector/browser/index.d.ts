/// connector/browser

import type {
  Connectors,
  DataConnector,
  MetaConnector,
  Synclet,
  SyncletImplementations,
  SyncletOptions,
  Transport,
} from '../../index.js';

/// LocalStorageDataConnector
export interface LocalStorageDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  /// LocalStorageDataConnector.getStorageName
  getStorageName(): string;
}

/// LocalStorageDataConnectorOptions
export type LocalStorageDataConnectorOptions<Depth extends number> = {
  /// LocalStorageDataConnectorOptions.depth
  depth: Depth;

  /// LocalStorageDataConnectorOptions.dataStorageName
  dataStorageName: string;
};

/// createLocalStorageDataConnector
export function createLocalStorageDataConnector<Depth extends number>(
  options: LocalStorageDataConnectorOptions<Depth>,
): LocalStorageDataConnector<Depth>;

/// LocalStorageMetaConnector
export interface LocalStorageMetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  /// LocalStorageMetaConnector.getStorageName
  getStorageName(): string;
}

/// LocalStorageMetaConnectorOptions
export type LocalStorageMetaConnectorOptions<Depth extends number> = {
  /// LocalStorageMetaConnectorOptions.depth
  depth: Depth;

  /// LocalStorageMetaConnectorOptions.metaStorageName
  metaStorageName: string;
};

/// createLocalStorageMetaConnector
export function createLocalStorageMetaConnector<Depth extends number>(
  options: LocalStorageMetaConnectorOptions<Depth>,
): LocalStorageMetaConnector<Depth>;

/// LocalStorageSyncletOptions
export type LocalStorageSyncletOptions<Depth extends number> =
  LocalStorageDataConnectorOptions<Depth> &
    LocalStorageMetaConnectorOptions<Depth> & {
      /// LocalStorageSyncletOptions.transport
      transport?: Transport | Transport[];

      /// LocalStorageSyncletOptions.implementations
      implementations?: SyncletImplementations<Depth>;
    } & SyncletOptions;

/// createLocalStorageSynclet
export function createLocalStorageSynclet<Depth extends number>(
  options: LocalStorageSyncletOptions<Depth>,
): Promise<
  Synclet<
    Depth,
    LocalStorageDataConnector<Depth>,
    LocalStorageMetaConnector<Depth>
  >
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
