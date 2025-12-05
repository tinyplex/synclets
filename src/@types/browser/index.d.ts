/// browser

import type {
  DataConnector,
  MetaConnector,
  Synclet,
  SyncletImplementations,
  SyncletOptions,
  Transport,
} from '../index.js';

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

/// SessionStorageDataConnectorOptions
export type SessionStorageDataConnectorOptions<Depth extends number> = {
  /// SessionStorageDataConnectorOptions.depth
  depth: Depth;

  /// SessionStorageDataConnectorOptions.dataStorageName
  dataStorageName: string;
};

/// createSessionStorageDataConnector
export function createSessionStorageDataConnector<Depth extends number>(
  options: SessionStorageDataConnectorOptions<Depth>,
): SessionStorageDataConnector<Depth>;

/// SessionStorageMetaConnector
export interface SessionStorageMetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  /// SessionStorageMetaConnector.getStorageName
  getStorageName(): string;
}

/// SessionStorageMetaConnectorOptions
export type SessionStorageMetaConnectorOptions<Depth extends number> = {
  /// SessionStorageMetaConnectorOptions.depth
  depth: Depth;

  /// SessionStorageMetaConnectorOptions.metaStorageName
  metaStorageName: string;
};

/// createSessionStorageMetaConnector
export function createSessionStorageMetaConnector<Depth extends number>(
  options: SessionStorageMetaConnectorOptions<Depth>,
): SessionStorageMetaConnector<Depth>;

/// SessionStorageSyncletOptions
export type SessionStorageSyncletOptions<Depth extends number> =
  SessionStorageDataConnectorOptions<Depth> &
    SessionStorageMetaConnectorOptions<Depth> & {
      /// SessionStorageSyncletOptions.transport
      transport?: Transport | Transport[];

      /// SessionStorageSyncletOptions.implementations
      implementations?: SyncletImplementations<Depth>;
    } & SyncletOptions;

/// createSessionStorageSynclet
export function createSessionStorageSynclet<Depth extends number>(
  options: SessionStorageSyncletOptions<Depth>,
): Promise<
  Synclet<
    Depth,
    SessionStorageDataConnector<Depth>,
    SessionStorageMetaConnector<Depth>
  >
>;
