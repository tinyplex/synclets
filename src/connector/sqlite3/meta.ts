import type {
  createSqlite3MetaConnector as createSqlite3MetaConnectorDecl,
  DatabaseMetaOptions,
  Sqlite3MetaConnector,
} from '@synclets/@types/connector/sqlite3';
import type {Database} from 'sqlite3';
import {createSqlite3Connector} from './common.ts';

export const createSqlite3MetaConnector: typeof createSqlite3MetaConnectorDecl =
  <Depth extends number>(
    depth: Depth,
    database: Database,
    {
      table = 'meta',
      addressColumn = 'address',
      timestampColumn = 'timestamp',
    }: DatabaseMetaOptions = {},
  ): Sqlite3MetaConnector<Depth> =>
    createSqlite3Connector(true, depth, database, {
      table,
      addressColumn,
      leafColumn: timestampColumn,
    });
