/// connector/sqlite3

import type {Database} from 'sqlite3';
import type {DataConnector, MetaConnector} from '../../index.js';

export type DatabaseDataOptions = {
  table?: string;
  addressColumn?: string;
  atomColumn?: string;
};

export interface Sqlite3DataConnector<Depth extends number>
  extends DataConnector<Depth> {
  getDatabase(): Database;
}

export function createSqlite3DataConnector<Depth extends number>(
  depth: Depth,
  database: Database,
  options?: DatabaseDataOptions,
): Sqlite3DataConnector<Depth>;

export type DatabaseMetaOptions = {
  table?: string;
  addressColumn?: string;
  timestampColumn?: string;
};

export interface Sqlite3MetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  getDatabase(): Database;
}

export function createSqlite3MetaConnector<Depth extends number>(
  depth: Depth,
  database: Database,
  options?: DatabaseMetaOptions,
): Sqlite3MetaConnector<Depth>;
