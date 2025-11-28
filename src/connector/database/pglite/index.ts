import type {PGlite} from '@electric-sql/pglite';
import type {
  DatabaseDataOptions,
  DatabaseMetaOptions,
} from '@synclets/@types/connector/database';
import {Sql} from '@synclets/@types/connector/database';
import type {
  createPgliteConnectors as createPgliteConnectorsDecl,
  createPgliteDataConnector as createPgliteDataConnectorDecl,
  createPgliteMetaConnector as createPgliteMetaConnectorDecl,
  PgliteDataConnector,
  PgliteMetaConnector,
} from '@synclets/@types/connector/database/pglite';
import {objFromEntries} from '../../../common/object.ts';
import {createDatabaseConnector} from '../common.ts';
import {getQuery, sql} from '../index.ts';

export const createPgliteConnectors: typeof createPgliteConnectorsDecl = <
  Depth extends number,
>(
  depth: Depth,
  pglite: PGlite,
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
  createPgliteDataConnector(depth, pglite, {
    table: dataTable,
    addressColumn,
    atomColumn,
  } as DatabaseDataOptions),
  createPgliteMetaConnector(depth, pglite, {
    table: metaTable,
    addressColumn,
    timestampColumn,
  } as DatabaseMetaOptions),
];

export const createPgliteDataConnector: typeof createPgliteDataConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
  pglite: PGlite,
  {
    table = 'data',
    addressColumn = 'address',
    atomColumn = 'atom',
  }: DatabaseDataOptions = {},
): PgliteDataConnector<Depth> =>
  createPgliteConnector(false, depth, pglite, {
    table,
    addressColumn,
    leafColumn: atomColumn,
  });

export const createPgliteMetaConnector: typeof createPgliteMetaConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
  pglite: PGlite,
  {
    table = 'meta',
    addressColumn = 'address',
    timestampColumn = 'timestamp',
  }: DatabaseMetaOptions = {},
): PgliteMetaConnector<Depth> =>
  createPgliteConnector(true, depth, pglite, {
    table,
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
