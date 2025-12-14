import {Sql} from '@synclets/@types/database';
import type {
  createDurableObjectStorageDataConnector as createDurableObjectStorageDataConnectorDecl,
  createDurableObjectStorageMetaConnector as createDurableObjectStorageMetaConnectorDecl,
  DurableObjectStorageDataConnector,
  DurableObjectStorageDataConnectorOptions,
  DurableObjectStorageMetaConnector,
  DurableObjectStorageMetaConnectorOptions,
} from '@synclets/@types/durable-object';
import {createSqliteDatabaseConnector} from '../common/database/sqlite.ts';
import {getQuery} from '../database/index.ts';

export const createDurableObjectStorageDataConnector: typeof createDurableObjectStorageDataConnectorDecl =
  <Depth extends number>({
    depth,
    storage,
    dataTable = 'data',
    addressColumn = 'address',
    atomColumn = 'atom',
  }: DurableObjectStorageDataConnectorOptions<Depth>): DurableObjectStorageDataConnector<Depth> =>
    createSqliteDatabaseConnector<
      false,
      Depth,
      DurableObjectStorageDataConnector<Depth>
    >(
      false,
      depth,
      async <Row>(sql: Sql) => {
        const [queryString, args] = getQuery(sql);
        const cursor = storage.sql.exec(queryString, ...args);
        return cursor.toArray() as Row[];
      },
      {getStorage: () => storage},
      {
        table: dataTable,
        addressColumn,
        leafColumn: atomColumn,
      },
    );

export const createDurableObjectStorageMetaConnector: typeof createDurableObjectStorageMetaConnectorDecl =
  <Depth extends number>({
    depth,
    storage,
    metaTable = 'meta',
    addressColumn = 'address',
    timestampColumn = 'timestamp',
  }: DurableObjectStorageMetaConnectorOptions<Depth>): DurableObjectStorageMetaConnector<Depth> =>
    createSqliteDatabaseConnector<
      true,
      Depth,
      DurableObjectStorageMetaConnector<Depth>
    >(
      true,
      depth,
      async <Row>(sql: Sql) => {
        const [queryString, args] = getQuery(sql);
        const cursor = storage.sql.exec(queryString, ...args);
        return cursor.toArray() as Row[];
      },
      {getStorage: () => storage},
      {
        table: metaTable,
        addressColumn,
        leafColumn: timestampColumn,
      },
    );
