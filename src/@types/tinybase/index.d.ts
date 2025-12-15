/// tinybase

import type {Store} from 'tinybase';
import type {
  DataConnector,
  MetaConnector,
  MetaConnectorOptions,
  Synclet,
  SyncletImplementations,
  SyncletOptions,
  Transport,
} from '../index.d.ts';

/// TinyBaseDataConnector
export interface TinyBaseDataConnector extends DataConnector<3> {
  /// TinyBaseDataConnector.getStore
  getStore(): Store;
}

/// TinyBaseDataConnectorOptions
export type TinyBaseDataConnectorOptions = {
  /// TinyBaseDataConnectorOptions.store
  readonly store: Store;
};

/// createTinyBaseDataConnector
export function createTinyBaseDataConnector(
  options: TinyBaseDataConnectorOptions,
): TinyBaseDataConnector;

/// TinyBaseSyncletOptions
export type TinyBaseSyncletOptions = TinyBaseDataConnectorOptions &
  Omit<MetaConnectorOptions<3>, 'depth'> & {
    /// TinyBaseSyncletOptions.transport
    readonly transport?: Transport | Transport[];

    /// TinyBaseSyncletOptions.implementations
    readonly implementations?: SyncletImplementations<3>;
  } & SyncletOptions;

/// TinyBaseSynclet
export type TinyBaseSynclet = Synclet<
  3,
  TinyBaseDataConnector,
  MetaConnector<3>
>;

/// createTinyBaseSynclet
export function createTinyBaseSynclet(
  options: TinyBaseSyncletOptions,
): Promise<TinyBaseSynclet>;
