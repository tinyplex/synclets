/// connector/sqlite3

import type {Database} from 'sqlite3';
import type {DataConnector, MetaConnector} from '../../index.js';

/// DatabaseDataOptions
export type DatabaseDataOptions = {
  table?: string;
  addressColumn?: string;
  atomColumn?: string;
};

/// Sqlite3DataConnector
export interface Sqlite3DataConnector<Depth extends number>
  extends DataConnector<Depth> {
  getDatabase(): Database;
}

/// createSqlite3DataConnector
export function createSqlite3DataConnector<Depth extends number>(
  depth: Depth,
  database: Database,
  options?: DatabaseDataOptions,
): Sqlite3DataConnector<Depth>;

/// DatabaseMetaOptions
export type DatabaseMetaOptions = {
  table?: string;
  addressColumn?: string;
  timestampColumn?: string;
};

/// Sqlite3MetaConnector
export interface Sqlite3MetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  getDatabase(): Database;
}

/// createSqlite3MetaConnector
export function createSqlite3MetaConnector<Depth extends number>(
  depth: Depth,
  database: Database,
  options?: DatabaseMetaOptions,
): Sqlite3MetaConnector<Depth>;
