/// sqlite3

import type {Database} from 'sqlite3';
import type {
  DataConnector,
  MetaConnector,
  Synclet,
  SyncletImplementations,
  SyncletOptions,
  Transport,
} from '../index.d.ts';

/// Sqlite3DataConnector
export interface Sqlite3DataConnector<Depth extends number>
  extends DataConnector<Depth> {
  /// Sqlite3DataConnector.getDatabase
  getDatabase(): Database;
}

/// Sqlite3DataConnectorOptions
export type Sqlite3DataConnectorOptions<Depth extends number> = {
  /// Sqlite3DataConnectorOptions.depth
  depth: Depth;

  /// Sqlite3DataConnectorOptions.database
  database: Database;

  /// Sqlite3DataConnectorOptions.dataTable
  dataTable?: string;

  /// Sqlite3DataConnectorOptions.addressColumn
  addressColumn?: string;

  /// Sqlite3DataConnectorOptions.atomColumn
  atomColumn?: string;
};

/// createSqlite3DataConnector
export function createSqlite3DataConnector<Depth extends number>(
  options: Sqlite3DataConnectorOptions<Depth>,
): Sqlite3DataConnector<Depth>;

/// Sqlite3MetaConnector
export interface Sqlite3MetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  /// Sqlite3MetaConnector.getDatabase
  getDatabase(): Database;
}

/// Sqlite3MetaConnectorOptions
export type Sqlite3MetaConnectorOptions<Depth extends number> = {
  /// Sqlite3MetaConnectorOptions.depth
  depth: Depth;

  /// Sqlite3MetaConnectorOptions.database
  database: Database;

  /// Sqlite3MetaConnectorOptions.metaTable
  metaTable?: string;

  /// Sqlite3MetaConnectorOptions.addressColumn
  addressColumn?: string;

  /// Sqlite3MetaConnectorOptions.timestampColumn
  timestampColumn?: string;
};

/// createSqlite3MetaConnector
export function createSqlite3MetaConnector<Depth extends number>(
  options: Sqlite3MetaConnectorOptions<Depth>,
): Sqlite3MetaConnector<Depth>;

/// Sqlite3SyncletOptions
export type Sqlite3SyncletOptions<Depth extends number> =
  Sqlite3DataConnectorOptions<Depth> &
    Sqlite3MetaConnectorOptions<Depth> & {
      /// Sqlite3SyncletOptions.transport
      transport?: Transport | Transport[];

      /// Sqlite3SyncletOptions.implementations
      implementations?: SyncletImplementations<Depth>;
    } & SyncletOptions;

/// createSqlite3Synclet
export function createSqlite3Synclet<Depth extends number>(
  options: Sqlite3SyncletOptions<Depth>,
): Promise<
  Synclet<Depth, Sqlite3DataConnector<Depth>, Sqlite3MetaConnector<Depth>>
>;
