/// connector/tinybase

import type {Store} from 'tinybase';
import type {DataConnector} from '../../index.d.ts';

export interface TinyBaseTablesDataConnector extends DataConnector<3> {
  getStore(): Store;
}

export function createTinyBaseTablesDataConnector(
  store: Store,
): TinyBaseTablesDataConnector;

export interface TinyBaseValuesDataConnector extends DataConnector<1> {
  getStore(): Store;
}

export function createTinyBaseValuesDataConnector(
  store: Store,
): TinyBaseValuesDataConnector;
