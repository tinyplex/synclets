import {Sql} from '@synclets/@types/database';
import type {
  createDurableObjectStorageDataConnector as createDurableObjectStorageDataConnectorDecl,
  createDurableObjectStorageMetaConnector as createDurableObjectStorageMetaConnectorDecl,
  DurableObjectStorageDataConnector,
  DurableObjectStorageDataConnectorOptions,
  DurableObjectStorageMetaConnector,
  DurableObjectStorageMetaConnectorOptions,
} from '@synclets/@types/durable-object';
import {createDatabaseConnector} from '../common/database.ts';
import {objFromEntries} from '../common/object.ts';
import {getQuery, sql} from '../database/index.ts';

export const createDurableObjectStorageDataConnector: typeof createDurableObjectStorageDataConnectorDecl =
  <Depth extends number>({
    depth,
    storage,
    dataTable = 'data',
    addressColumn = 'address',
    atomColumn = 'atom',
  }: DurableObjectStorageDataConnectorOptions<Depth>): DurableObjectStorageDataConnector<Depth> =>
    createDatabaseConnector(
      false,
      depth,
      async <Row>(sql: Sql) => {
        const [queryString, args] = getQuery(sql);
        const cursor = storage.sql.exec(queryString, ...args);
        return cursor.toArray() as Row[];
      },
      async () => {
        const columns = await (async () => {
          const [queryString, args] = getQuery(
            sql`SELECT name, type FROM pragma_table_info(${dataTable}) ORDER BY name`,
          );
          const cursor = storage.sql.exec(queryString, ...args);
          return cursor.toArray() as {name: string; type: string}[];
        })();
        return objFromEntries(columns.map(({name, type}) => [name, type]));
      },
      {getStorage: () => storage},
      {
        table: dataTable,
        addressColumn,
        leafColumn: atomColumn,
      },
    ) as DurableObjectStorageDataConnector<Depth>;

export const createDurableObjectStorageMetaConnector: typeof createDurableObjectStorageMetaConnectorDecl =
  <Depth extends number>({
    depth,
    storage,
    metaTable = 'meta',
    addressColumn = 'address',
    timestampColumn = 'timestamp',
  }: DurableObjectStorageMetaConnectorOptions<Depth>): DurableObjectStorageMetaConnector<Depth> =>
    createDatabaseConnector(
      true,
      depth,
      async <Row>(sql: Sql) => {
        const [queryString, args] = getQuery(sql);
        const cursor = storage.sql.exec(queryString, ...args);
        return cursor.toArray() as Row[];
      },
      async () => {
        const columns = await (async () => {
          const [queryString, args] = getQuery(
            sql`SELECT name, type FROM pragma_table_info(${metaTable}) ORDER BY name`,
          );
          const cursor = storage.sql.exec(queryString, ...args);
          return cursor.toArray() as {name: string; type: string}[];
        })();
        return objFromEntries(columns.map(({name, type}) => [name, type]));
      },
      {getStorage: () => storage},
      {
        table: metaTable,
        addressColumn,
        leafColumn: timestampColumn,
      },
    ) as DurableObjectStorageMetaConnector<Depth>;
