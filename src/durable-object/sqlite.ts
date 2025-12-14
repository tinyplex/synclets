import {Sql} from '@synclets/@types/database';
import type {
  createDurableObjectSqliteDataConnector as createDurableObjectSqliteDataConnectorDecl,
  createDurableObjectSqliteMetaConnector as createDurableObjectSqliteMetaConnectorDecl,
  DurableObjectSqliteDataConnector,
  DurableObjectSqliteDataConnectorOptions,
  DurableObjectSqliteMetaConnector,
  DurableObjectSqliteMetaConnectorOptions,
} from '@synclets/@types/durable-object';
import {createSqliteDatabaseConnector} from '../common/database/sqlite.ts';
import {getQuery} from '../database/index.ts';

export const createDurableObjectSqliteDataConnector: typeof createDurableObjectSqliteDataConnectorDecl =
  <Depth extends number>(
    options: DurableObjectSqliteDataConnectorOptions<Depth>,
  ): DurableObjectSqliteDataConnector<Depth> =>
    createDurableObjectSqliteConnector(false, options);

export const createDurableObjectSqliteMetaConnector: typeof createDurableObjectSqliteMetaConnectorDecl =
  <Depth extends number>(
    options: DurableObjectSqliteMetaConnectorOptions<Depth>,
  ): DurableObjectSqliteMetaConnector<Depth> =>
    createDurableObjectSqliteConnector(true, options);

const createDurableObjectSqliteConnector = <
  CreateMeta extends boolean,
  Depth extends number,
>(
  createMeta: CreateMeta,
  {
    storage,
    ...options
  }: CreateMeta extends true
    ? DurableObjectSqliteMetaConnectorOptions<Depth>
    : DurableObjectSqliteDataConnectorOptions<Depth>,
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
    ? DurableObjectSqliteMetaConnector<Depth>
    : DurableObjectSqliteDataConnector<Depth>;
