import type {
  DatabaseDataOptions,
  DatabaseMetaOptions,
  Sql,
} from '@synclets/@types/connector/database';
import type {
  createSqlite3Connectors as createSqlite3ConnectorsDecl,
  createSqlite3DataConnector as createSqlite3DataConnectorDecl,
  createSqlite3MetaConnector as createSqlite3MetaConnectorDecl,
  Sqlite3DataConnector,
  Sqlite3MetaConnector,
} from '@synclets/@types/connector/database/sqlite3';
import type {Database} from 'sqlite3';
import {objFromEntries} from '../../../common/object.ts';
import {promiseNew} from '../../../common/other.ts';
import {createDatabaseConnector} from '../common.ts';
import {getQuery, sql} from '../index.ts';

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

const createSqlite3Connector = <
  CreateMeta extends boolean,
  Depth extends number,
>(
  createMeta: CreateMeta,
  depth: Depth,
  database: Database,
  config: {
    table: string;
    addressColumn: string;
    leafColumn: string;
  },
) => {
  const query = <Row>(sql: Sql): Promise<Row[]> =>
    promiseNew((resolve, reject) => {
      database.all(...getQuery(sql), (error, rows: Row[]) =>
        error ? reject(error) : resolve(rows),
      );
    });

  const getSchema = async () =>
    objFromEntries(
      (
        await query<{name: string; type: string}>(
          sql`
          SELECT name 
          FROM pragma_table_info(${config.table})
          ORDER BY name
        `,
        )
      ).map(({name}) => [name, 'text']),
    );

  return createDatabaseConnector(
    createMeta,
    depth,
    query,
    getSchema,
    {getDatabase: () => database},
    config,
  ) as CreateMeta extends true
    ? Sqlite3MetaConnector<Depth>
    : Sqlite3DataConnector<Depth>;
};
