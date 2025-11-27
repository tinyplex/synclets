import type {
  DatabaseDataOptions,
  DatabaseMetaOptions,
} from '@synclets/@types/connector/database';
import type {createSqlite3Connectors as createSqlite3ConnectorsDecl} from '@synclets/@types/connector/database/sqlite3';
import type {Database} from 'sqlite3';
import {createSqlite3DataConnector} from './data.ts';
import {createSqlite3MetaConnector} from './meta.ts';

export const createSqlite3Connectors: typeof createSqlite3ConnectorsDecl = <
  Depth extends number,
>(
  depth: Depth,
  database: Database,
  {
    dataTable = 'data',
    metaTable = 'meta',
    addressColumn = 'address',
    atomColumn = 'atom',
    timestampColumn = 'timestamp',
  }: {
    dataTable?: string;
    metaTable?: string;
    addressColumn?: string;
    atomColumn?: string;
    timestampColumn?: string;
  } = {},
) => [
  createSqlite3DataConnector(depth, database, {
    table: dataTable,
    addressColumn,
    atomColumn,
  } as DatabaseDataOptions),
  createSqlite3MetaConnector(depth, database, {
    table: metaTable,
    addressColumn,
    timestampColumn,
  } as DatabaseMetaOptions),
];
