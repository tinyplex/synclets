import type {PGlite} from '@electric-sql/pglite';
import {createSynclet} from '@synclets';
import {Sql} from '@synclets/@types/connector/database';
import type {
  createPgliteDataConnector as createPgliteDataConnectorDecl,
  createPgliteMetaConnector as createPgliteMetaConnectorDecl,
  createPgliteSynclet as createPgliteSyncletDecl,
  PgliteDataConnector,
  PgliteDataConnectorOptions,
  PgliteMetaConnector,
  PgliteMetaConnectorOptions,
  PgliteSyncletOptions,
} from '@synclets/@types/pglite';
import {objFromEntries} from '../common/object.ts';
import {createDatabaseConnector} from '../connector/database/common.ts';
import {getQuery, sql} from '../connector/database/index.ts';

export const createPgliteDataConnector: typeof createPgliteDataConnectorDecl = <
  Depth extends number,
>({
  depth,
  pglite,
  dataTable = 'data',
  addressColumn = 'address',
  atomColumn = 'atom',
}: PgliteDataConnectorOptions<Depth>): PgliteDataConnector<Depth> =>
  createPgliteConnector(false, depth, pglite, {
    table: dataTable,
    addressColumn,
    leafColumn: atomColumn,
  });

export const createPgliteMetaConnector: typeof createPgliteMetaConnectorDecl = <
  Depth extends number,
>({
  depth,
  pglite,
  metaTable = 'meta',
  addressColumn = 'address',
  timestampColumn = 'timestamp',
}: PgliteMetaConnectorOptions<Depth>): PgliteMetaConnector<Depth> =>
  createPgliteConnector(true, depth, pglite, {
    table: metaTable,
    addressColumn,
    leafColumn: timestampColumn,
  });

const createPgliteConnector = <
  CreateMeta extends boolean,
  Depth extends number,
>(
  createMeta: CreateMeta,
  depth: Depth,
  pglite: PGlite,
  config: {
    table: string;
    addressColumn: string;
    leafColumn: string;
  },
) => {
  const query = async <Row>(sql: Sql): Promise<Row[]> =>
    (await pglite.query<Row>(...getQuery(sql))).rows;

  const getSchema = async () =>
    objFromEntries(
      (
        await query<{name: string; type: string}>(
          sql`
            SELECT column_name AS name, data_type AS type 
            FROM information_schema.columns 
            WHERE table_name=${config.table} 
            ORDER BY column_name
          `,
        )
      ).map(({name, type}) => [name, type]),
    );

  return createDatabaseConnector(
    createMeta,
    depth,
    query,
    getSchema,
    {getPglite: () => pglite},
    config,
  ) as CreateMeta extends true
    ? PgliteMetaConnector<Depth>
    : PgliteDataConnector<Depth>;
};

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
