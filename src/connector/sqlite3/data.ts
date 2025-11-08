import type {
  createSqlite3DataConnector as createSqlite3DataConnectorDecl,
  DatabaseDataOptions,
  Sqlite3DataConnector,
} from '@synclets/@types/connector/sqlite3';
import type {Database} from 'sqlite3';
import {createSqlite3Connector} from './common.ts';

export const createSqlite3DataConnector: typeof createSqlite3DataConnectorDecl =
  <Depth extends number>(
    depth: Depth,
    database: Database,
    {
      table = 'data',
      addressColumn = 'address',
      atomColumn = 'atom',
    }: DatabaseDataOptions = {},
  ): Sqlite3DataConnector<Depth> =>
    createSqlite3Connector(false, depth, database, {
      table,
      addressColumn,
      leafColumn: atomColumn,
    });
