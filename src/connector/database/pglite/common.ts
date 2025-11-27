import type {PGlite} from '@electric-sql/pglite';
import {Sql} from '@synclets/@types/connector/database';
import type {
  PgliteDataConnector,
  PgliteMetaConnector,
} from '@synclets/@types/connector/database/pglite';
import {objFromEntries} from '../../../common/object.ts';
import {createDatabaseConnector} from '../common.ts';
import {getQuery, sql} from '../index.ts';

export const createPgliteConnector = <
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
