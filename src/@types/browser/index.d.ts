/// browser

import type {
  DataConnector,
  DataConnectorOptions,
  MetaConnector,
  MetaConnectorOptions,
  Synclet,
  SyncletImplementations,
  SyncletOptions,
  Transport,
  TransportOptions,
} from '../index.d.ts';

/// BroadcastChannelTransport
export interface BroadcastChannelTransport extends Transport {
  /// BroadcastChannelTransport.getChannelName
  getChannelName(): string;
}

/// BroadcastChannelTransportOptions
export type BroadcastChannelTransportOptions = {
  /// BroadcastChannelTransportOptions.channelName
  readonly channelName: string;
} & TransportOptions;

/// createBroadcastChannelTransport
export function createBroadcastChannelTransport(
  options: BroadcastChannelTransportOptions,
): BroadcastChannelTransport;

/// LocalStorageDataConnector
export interface LocalStorageDataConnector<
  Depth extends number,
> extends DataConnector<Depth> {
  /// LocalStorageDataConnector.getStorageName
  getStorageName(): string;
}

/// LocalStorageDataConnectorOptions
export type LocalStorageDataConnectorOptions<Depth extends number> = {
  /// LocalStorageDataConnectorOptions.dataStorageName
  readonly dataStorageName: string;
} & DataConnectorOptions<Depth>;

/// createLocalStorageDataConnector
export function createLocalStorageDataConnector<const Depth extends number>(
  options: LocalStorageDataConnectorOptions<Depth>,
): LocalStorageDataConnector<Depth>;

/// LocalStorageMetaConnector
export interface LocalStorageMetaConnector<
  Depth extends number,
> extends MetaConnector<Depth> {
  /// LocalStorageMetaConnector.getStorageName
  getStorageName(): string;
}

/// LocalStorageMetaConnectorOptions
export type LocalStorageMetaConnectorOptions<Depth extends number> = {
  /// LocalStorageMetaConnectorOptions.metaStorageName
  readonly metaStorageName: string;
} & MetaConnectorOptions<Depth>;

/// createLocalStorageMetaConnector
export function createLocalStorageMetaConnector<const Depth extends number>(
  options: LocalStorageMetaConnectorOptions<Depth>,
): LocalStorageMetaConnector<Depth>;

/// LocalStorageSyncletOptions
export type LocalStorageSyncletOptions<Depth extends number> =
  LocalStorageDataConnectorOptions<Depth> &
    LocalStorageMetaConnectorOptions<Depth> & {
      /// LocalStorageSyncletOptions.transport
      readonly transport?: Transport | Transport[];

      /// LocalStorageSyncletOptions.implementations
      readonly implementations?: SyncletImplementations<Depth>;
    } & SyncletOptions;

/// LocalStorageSynclet
export type LocalStorageSynclet<Depth extends number> = Synclet<
  Depth,
  LocalStorageDataConnector<Depth>,
  LocalStorageMetaConnector<Depth>
>;

/// createLocalStorageSynclet
export function createLocalStorageSynclet<Depth extends number>(
  options: LocalStorageSyncletOptions<Depth>,
): Promise<LocalStorageSynclet<Depth>>;

/// SessionStorageDataConnector
export interface SessionStorageDataConnector<
  Depth extends number,
> extends DataConnector<Depth> {
  /// SessionStorageDataConnector.getStorageName
  getStorageName(): string;
}

/// SessionStorageDataConnectorOptions
export type SessionStorageDataConnectorOptions<Depth extends number> = {
  /// SessionStorageDataConnectorOptions.dataStorageName
  readonly dataStorageName: string;
} & DataConnectorOptions<Depth>;

/// createSessionStorageDataConnector
export function createSessionStorageDataConnector<const Depth extends number>(
  options: SessionStorageDataConnectorOptions<Depth>,
): SessionStorageDataConnector<Depth>;

/// SessionStorageMetaConnector
export interface SessionStorageMetaConnector<
  Depth extends number,
> extends MetaConnector<Depth> {
  /// SessionStorageMetaConnector.getStorageName
  getStorageName(): string;
}

/// SessionStorageMetaConnectorOptions
export type SessionStorageMetaConnectorOptions<Depth extends number> = {
  /// SessionStorageMetaConnectorOptions.metaStorageName
  readonly metaStorageName: string;
} & MetaConnectorOptions<Depth>;

/// createSessionStorageMetaConnector
export function createSessionStorageMetaConnector<const Depth extends number>(
  options: SessionStorageMetaConnectorOptions<Depth>,
): SessionStorageMetaConnector<Depth>;

/// SessionStorageSyncletOptions
export type SessionStorageSyncletOptions<Depth extends number> =
  SessionStorageDataConnectorOptions<Depth> &
    SessionStorageMetaConnectorOptions<Depth> & {
      /// SessionStorageSyncletOptions.transport
      readonly transport?: Transport | Transport[];

      /// SessionStorageSyncletOptions.implementations
      readonly implementations?: SyncletImplementations<Depth>;
    } & SyncletOptions;

/// SessionStorageSynclet
export type SessionStorageSynclet<Depth extends number> = Synclet<
  Depth,
  SessionStorageDataConnector<Depth>,
  SessionStorageMetaConnector<Depth>
>;

/// createSessionStorageSynclet
export function createSessionStorageSynclet<Depth extends number>(
  options: SessionStorageSyncletOptions<Depth>,
): Promise<SessionStorageSynclet<Depth>>;
