import type {Sql} from '@synclets/@types/connector/database';
import type {
  Sqlite3DataConnector,
  Sqlite3MetaConnector,
} from '@synclets/@types/connector/database/sqlite3';
import type {Database} from 'sqlite3';
import {objFromEntries} from '../../../common/object.ts';
import {promiseNew} from '../../../common/other.ts';
import {createDatabaseConnector} from '../common.ts';
import {getQuery, sql} from '../index.ts';

export const createSqlite3Connector = <
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
