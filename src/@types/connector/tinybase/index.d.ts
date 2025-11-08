/// connector/tinybase

import type {Store} from 'tinybase';
import type {DataConnector} from '../../index.d.ts';

/// TinyBaseDataConnector
export interface TinyBaseDataConnector extends DataConnector<3> {
  getStore(): Store;
}

/// createTinyBaseDataConnector
export function createTinyBaseDataConnector(
  store: Store,
): TinyBaseDataConnector;
