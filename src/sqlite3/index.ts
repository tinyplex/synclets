import {createSynclet} from '@synclets';
import type {Sql} from '@synclets/@types/connector/database';
import type {
  createSqlite3DataConnector as createSqlite3DataConnectorDecl,
  createSqlite3MetaConnector as createSqlite3MetaConnectorDecl,
  createSqlite3Synclet as createSqlite3SyncletDecl,
  Sqlite3DataConnector,
  Sqlite3DataConnectorOptions,
  Sqlite3MetaConnector,
  Sqlite3MetaConnectorOptions,
  Sqlite3SyncletOptions,
} from '@synclets/@types/sqlite3';
import type {Database} from 'sqlite3';
import {objFromEntries} from '../common/object.ts';
import {promiseNew} from '../common/other.ts';
import {createDatabaseConnector} from '../connector/database/common.ts';
import {getQuery, sql} from '../connector/database/index.ts';

export const createSqlite3DataConnector: typeof createSqlite3DataConnectorDecl =
  <Depth extends number>({
    depth,
    database,
    dataTable = 'data',
    addressColumn = 'address',
    atomColumn = 'atom',
  }: Sqlite3DataConnectorOptions<Depth>): Sqlite3DataConnector<Depth> =>
    createSqlite3Connector(false, depth, database, {
      table: dataTable,
      addressColumn,
      leafColumn: atomColumn,
    });

export const createSqlite3MetaConnector: typeof createSqlite3MetaConnectorDecl =
  <Depth extends number>({
    depth,
    database,
    metaTable = 'meta',
    addressColumn = 'address',
    timestampColumn = 'timestamp',
  }: Sqlite3MetaConnectorOptions<Depth>): Sqlite3MetaConnector<Depth> =>
    createSqlite3Connector(true, depth, database, {
      table: metaTable,
      addressColumn,
      leafColumn: timestampColumn,
    });

export const createSqlite3Synclet: typeof createSqlite3SyncletDecl = <
  Depth extends number,
>({
  depth,
  database,
  dataTable,
  metaTable,
  addressColumn,
  atomColumn,
  timestampColumn,
  transport,
  implementations,
  id,
  logger,
}: Sqlite3SyncletOptions<Depth>) =>
  createSynclet(
    {
      dataConnector: createSqlite3DataConnector({
        depth,
        database,
        dataTable,
        addressColumn,
        atomColumn,
      }),
      metaConnector: createSqlite3MetaConnector({
        depth,
        database,
        metaTable,
        addressColumn,
        timestampColumn,
      }),
      transport,
    },
    implementations,
    {id, logger},
  );

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
