import {
  DatabaseDataConnectorOptions,
  DatabaseMetaConnectorOptions,
  Sql,
  TableSchema,
} from '@synclets/@types/database';
import {sql} from '../../database/index.ts';
import {objFromEntries} from '../object.ts';
import {createDatabaseConnector} from './index.ts';

export const getSqliteTableSchema = async (
  table: string,
  query: <Row>(sql: Sql) => Promise<Row[]>,
): Promise<TableSchema> =>
  objFromEntries(
    (
      await query<{name: string; type: string}>(
        sql`
          SELECT name, type 
          FROM pragma_table_info(${table}) 
          ORDER BY name;
        `,
      )
    ).map(({name, type}) => [name, type.toLowerCase()]),
  );

export const createSqliteDatabaseConnector = <
  CreateMeta extends boolean,
  Depth extends number,
  Connector,
>(
  createMeta: CreateMeta,
  options: CreateMeta extends true
    ? DatabaseMetaConnectorOptions<Depth>
    : DatabaseDataConnectorOptions<Depth>,
  query: <Row>(sql: Sql) => Promise<Row[]>,
  extraMethods: {[name: string]: any},
): Connector => {
  const getSchema = (table: string) => getSqliteTableSchema(table, query);

  return createDatabaseConnector(
    createMeta,
    options,
    query,
    getSchema,
    extraMethods,
  ) as Connector;
};
