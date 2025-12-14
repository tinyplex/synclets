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
  <Depth extends number>(
    options: DurableObjectStorageDataConnectorOptions<Depth>,
  ): DurableObjectStorageDataConnector<Depth> =>
    createDurableObjectStorageConnector(false, options);

export const createDurableObjectStorageMetaConnector: typeof createDurableObjectStorageMetaConnectorDecl =
  <Depth extends number>(
    options: DurableObjectStorageMetaConnectorOptions<Depth>,
  ): DurableObjectStorageMetaConnector<Depth> =>
    createDurableObjectStorageConnector(true, options);

const createDurableObjectStorageConnector = <
  CreateMeta extends boolean,
  Depth extends number,
>(
  createMeta: CreateMeta,
  {
    storage,
    ...options
  }: CreateMeta extends true
    ? DurableObjectStorageMetaConnectorOptions<Depth>
    : DurableObjectStorageDataConnectorOptions<Depth>,
) =>
  createSqliteDatabaseConnector<CreateMeta, Depth, any>(
    createMeta,
    options,
    async <Row>(sql: Sql) => {
      const [queryString, args] = getQuery(sql);
      return storage.sql.exec(queryString, ...args).toArray() as Row[];
    },
    {getStorage: () => storage},
  ) as CreateMeta extends true
    ? DurableObjectStorageMetaConnector<Depth>
    : DurableObjectStorageDataConnector<Depth>;
