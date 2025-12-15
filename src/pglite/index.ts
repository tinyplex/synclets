import {PGlite} from '@electric-sql/pglite';
import {createSynclet} from '@synclets';
import {Sql} from '@synclets/@types/database';
import type {
  createPgliteDataConnector as createPgliteDataConnectorDecl,
  createPgliteMetaConnector as createPgliteMetaConnectorDecl,
  createPgliteSynclet as createPgliteSyncletDecl,
  getTableSchema as getTableSchemaDecl,
  PgliteDataConnector,
  PgliteDataConnectorOptions,
  PgliteMetaConnector,
  PgliteMetaConnectorOptions,
  PgliteSyncletOptions,
} from '@synclets/@types/pglite';
import {
  createPostgresDatabaseConnector,
  getPostgresTableSchema,
} from '../common/database/postgres.ts';
import {getQuery} from '../database/index.ts';

const createQuery =
  (pglite: PGlite) =>
  async <Row>(sql: Sql): Promise<Row[]> =>
    (await pglite.query<Row>(...getQuery(sql))).rows;

export const createPgliteDataConnector: typeof createPgliteDataConnectorDecl = <
  Depth extends number,
>(
  options: PgliteDataConnectorOptions<Depth>,
): PgliteDataConnector<Depth> => createPgliteConnector(false, options);

export const createPgliteMetaConnector: typeof createPgliteMetaConnectorDecl = <
  Depth extends number,
>(
  options: PgliteDataConnectorOptions<Depth>,
): PgliteMetaConnector<Depth> => createPgliteConnector(true, options);

export const createPgliteSynclet: typeof createPgliteSyncletDecl = <
  Depth extends number,
>({
  depth,
  pglite,
  dataTable,
  metaTable,
  addressColumn,
  atomColumn,
  timestampColumn,
  transport,
  implementations,
  id,
  logger,
}: PgliteSyncletOptions<Depth>) =>
  createSynclet(
    {
      dataConnector: createPgliteDataConnector({
        depth,
        pglite,
        dataTable,
        addressColumn,
        atomColumn,
      }),
      metaConnector: createPgliteMetaConnector({
        depth,
        pglite,
        metaTable,
        addressColumn,
        timestampColumn,
      }),
      transport,
    },
    implementations,
    {id, logger},
  );

const createPgliteConnector = <
  CreateMeta extends boolean,
  Depth extends number,
>(
  createMeta: CreateMeta,
  {
    pglite,
    ...options
  }: CreateMeta extends true
    ? PgliteMetaConnectorOptions<Depth>
    : PgliteDataConnectorOptions<Depth>,
) =>
  createPostgresDatabaseConnector<CreateMeta, Depth, any>(
    createMeta,
    options,
    createQuery(pglite),
    {getPglite: () => pglite},
  ) as CreateMeta extends true
    ? PgliteMetaConnector<Depth>
    : PgliteDataConnector<Depth>;

export const getTableSchema: typeof getTableSchemaDecl = (
  pglite,
  table,
) => getPostgresTableSchema(table, createQuery(pglite));
