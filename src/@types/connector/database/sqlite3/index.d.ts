/// connector/database/sqlite3

import type {Database} from 'sqlite3';
import type {DataConnector, MetaConnector} from '../../../index.d.ts';
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
