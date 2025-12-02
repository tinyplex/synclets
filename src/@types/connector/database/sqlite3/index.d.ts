/// connector/database/sqlite3

import type {Database} from 'sqlite3';
import type {
  Connectors,
  DataConnector,
  MetaConnector,
} from '../../../index.d.ts';
import type {DatabaseDataOptions, DatabaseMetaOptions} from '../index.d.ts';

/// Sqlite3DataConnector
export interface Sqlite3DataConnector<Depth extends number>
  extends DataConnector<Depth> {
  /// Sqlite3DataConnector.getDatabase
  getDatabase(): Database;
}

/// createSqlite3DataConnector
export function createSqlite3DataConnector<Depth extends number>(
  depth: Depth,
  database: Database,
  options?: DatabaseDataOptions,
): Sqlite3DataConnector<Depth>;

/// Sqlite3MetaConnector
export interface Sqlite3MetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  /// Sqlite3MetaConnector.getDatabase
  getDatabase(): Database;
}

/// createSqlite3MetaConnector
export function createSqlite3MetaConnector<Depth extends number>(
  depth: Depth,
  database: Database,
  options?: DatabaseMetaOptions,
): Sqlite3MetaConnector<Depth>;

/// Sqlite3ConnectorsOptions
export type Sqlite3ConnectorsOptions = {
  /// Sqlite3ConnectorsOptions.dataTable
  dataTable?: string;

  /// Sqlite3ConnectorsOptions.metaTable
  metaTable?: string;

  /// Sqlite3ConnectorsOptions.addressColumn
  addressColumn?: string;

  /// Sqlite3ConnectorsOptions.atomColumn
  atomColumn?: string;

  /// Sqlite3ConnectorsOptions.timestampColumn
  timestampColumn?: string;
};

/// createSqlite3Connectors
export function createSqlite3Connectors<Depth extends number>(
  depth: Depth,
  database: Database,
  options?: Sqlite3ConnectorsOptions,
): Connectors<Depth, Sqlite3DataConnector<Depth>, Sqlite3MetaConnector<Depth>>;
