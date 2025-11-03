/// connector/tinybase

import type {Store} from 'tinybase';
import type {DataConnector} from '../../index.d.ts';

export interface TinyBaseDataConnector extends DataConnector<3> {
  getStore(): Store;
}

export function createTinyBaseDataConnector(
  store: Store,
): TinyBaseDataConnector;
