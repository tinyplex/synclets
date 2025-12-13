/// tinybase

import type {Store} from 'tinybase';
import type {DataConnector} from '../index.d.ts';

/// TinyBaseDataConnector
export interface TinyBaseDataConnector extends DataConnector<3> {
  /// TinyBaseDataConnector.getStore
  getStore(): Store;
}

/// TinyBaseDataConnectorOptions
export type TinyBaseDataConnectorOptions = {
  /// TinyBaseDataConnectorOptions.store
  store: Store;
};

/// createTinyBaseDataConnector
export function createTinyBaseDataConnector(
  options: TinyBaseDataConnectorOptions,
): TinyBaseDataConnector;
