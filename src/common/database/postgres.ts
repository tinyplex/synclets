import {
  DatabaseDataConnectorOptions,
  DatabaseMetaConnectorOptions,
  Sql,
  TableSchema,
} from '@synclets/@types/database';
import {sql} from '../../database/index.ts';
import {objFromEntries} from '../object.ts';
import {createDatabaseConnector} from './index.ts';

export const getPostgresTableSchema = async (
  table: string,
  query: <Row>(sql: Sql) => Promise<Row[]>,
): Promise<TableSchema> =>
  objFromEntries(
    (
      await query<{name: string; type: string}>(
        sql`
          SELECT column_name AS name, data_type AS type 
          FROM information_schema.columns 
          WHERE table_name=${table} 
          ORDER BY column_name
        `,
      )
    ).map(({name, type}) => [name, type.toLowerCase()]),
  );

export const createPostgresDatabaseConnector = <
  CreateMeta extends boolean,
  Depth extends number,
  Connector,
>(
  createMeta: CreateMeta,
  options: CreateMeta extends true
    ? DatabaseMetaConnectorOptions<Depth>
    : DatabaseDataConnectorOptions<Depth>,
  query: <Row>(sql: Sql) => Promise<Row[]>,
  extraFunctions: {[name: string]: any},
): Connector => {
  const getSchema = (table: string) => getPostgresTableSchema(table, query);

  return createDatabaseConnector(
    createMeta,
    options,
    query,
    getSchema,
    extraFunctions,
  ) as Connector;
};
