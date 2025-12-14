import {createSynclet} from '@synclets';
import type {Sql} from '@synclets/@types/database';
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
import {createSqliteDatabaseConnector} from '../common/database/sqlite.ts';
import {promiseNew} from '../common/other.ts';
import {getQuery} from '../database/index.ts';

export const createSqlite3DataConnector: typeof createSqlite3DataConnectorDecl =
  <Depth extends number>(
    options: Sqlite3DataConnectorOptions<Depth>,
  ): Sqlite3DataConnector<Depth> => createSqlite3Connector(false, options);

export const createSqlite3MetaConnector: typeof createSqlite3MetaConnectorDecl =
  <Depth extends number>(
    options: Sqlite3MetaConnectorOptions<Depth>,
  ): Sqlite3MetaConnector<Depth> => createSqlite3Connector(true, options);

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
  {
    database,
    ...options
  }: CreateMeta extends true
    ? Sqlite3MetaConnectorOptions<Depth>
    : Sqlite3DataConnectorOptions<Depth>,
) =>
  createSqliteDatabaseConnector<CreateMeta, Depth, any>(
    createMeta,
    options,
    <Row>(sql: Sql) =>
      promiseNew<Row[]>((resolve, reject) => {
        database.all(...getQuery(sql), (error: Error | null, rows: Row[]) =>
          error ? reject(error) : resolve(rows),
        );
      }),
    {getDatabase: () => database},
  ) as CreateMeta extends true
    ? Sqlite3MetaConnector<Depth>
    : Sqlite3DataConnector<Depth>;
