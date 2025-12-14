import {Sql} from '@synclets/@types/database';
import {sql} from '../../database/index.ts';
import {objFromEntries} from '../object.ts';
import {createDatabaseConnector} from './index.ts';

export const createSqliteDatabaseConnector = <
  CreateMeta extends boolean,
  Depth extends number,
  Connector,
>(
  createMeta: CreateMeta,
  depth: Depth,
  query: <Row>(sql: Sql) => Promise<Row[]>,
  extraFunctions: {[name: string]: any},
  config: {
    table: string;
    addressColumn: string;
    leafColumn: string;
  },
): Connector => {
  const getSchema = async () =>
    objFromEntries(
      (
        await query<{name: string; type: string}>(
          sql`
            SELECT name, type 
            FROM pragma_table_info(${config.table}) 
            ORDER BY name;
          `,
        )
      ).map(({name, type}) => [name, type.toLowerCase()]),
    );

  return createDatabaseConnector(
    createMeta,
    depth,
    query,
    getSchema,
    extraFunctions,
    config,
  ) as Connector;
};
