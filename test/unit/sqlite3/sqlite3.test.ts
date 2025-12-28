import {Database} from 'sqlite3';
import {createSynclet} from 'synclets';
import {createMemoryTransport} from 'synclets/memory';
import {
  createSqlite3DataConnector,
  createSqlite3MetaConnector,
  createSqlite3Synclet,
  getTableSchema,
} from 'synclets/sqlite3';
import {expect, test} from 'vitest';
import {describeCommonSyncletTests, describeSchemaTests} from '../common.ts';

const query = <Row>(
  database: Database,
  sql: string,
  params: any[] = [],
): Promise<Row[]> =>
  new Promise<Row[]>((resolve, reject) => {
    database.all(sql, params, (error, rows: Row[]) =>
      error ? reject(error) : resolve(rows),
    );
  });

describeCommonSyncletTests(
  async () => {},
  async () => {},
  <Depth extends number>(depth: Depth) =>
    createSqlite3DataConnector({depth, database: new Database(':memory:')}),
  <Depth extends number>(depth: Depth) =>
    createSqlite3MetaConnector({depth, database: new Database(':memory:')}),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);

test('getDatabase', async () => {
  const dataDatabase = new Database(':memory:');
  const metaDatabase = new Database(':memory:');

  const dataConnector = createSqlite3DataConnector({
    depth: 1,
    database: dataDatabase,
  });
  const metaConnector = createSqlite3MetaConnector({
    depth: 1,
    database: metaDatabase,
  });

  const synclet = await createSynclet({dataConnector, metaConnector});

  expect(dataConnector.getDatabase()).toEqual(dataDatabase);
  expect(synclet.getDataConnector()!.getDatabase()).toEqual(dataDatabase);

  expect(metaConnector.getDatabase()).toEqual(metaDatabase);
  expect(synclet.getMetaConnector()!.getDatabase()).toEqual(metaDatabase);

  dataDatabase.close();
  metaDatabase.close();

  await synclet.destroy();
});

test('getDatabase, synclet', async () => {
  const database = new Database(':memory:');
  const synclet = await createSqlite3Synclet({
    depth: 1,
    database,
  });

  expect(synclet.getDataConnector()!.getDatabase()).toEqual(database);
  expect(synclet.getMetaConnector()!.getDatabase()).toEqual(database);

  database.close();

  await synclet.destroy();
});

test('getTableSchema', async () => {
  const database = new Database(':memory:');
  await query(
    database,
    `CREATE TABLE test_table (id INTEGER, name TEXT, value REAL);`,
  );

  const schema = await getTableSchema(database, 'test_table');

  expect(schema).toEqual({
    id: 'integer',
    name: 'text',
    value: 'real',
  });

  database.close();
});

describeSchemaTests(
  'sqlite3',
  () => new Database(':memory:'),
  (database) => database.close(),
  (database, sql) => query(database, sql),
  (database, table) => getTableSchema(database, table),
  (db, options) => createSqlite3DataConnector({database: db, ...options}),
  (db, options) => createSqlite3MetaConnector({database: db, ...options}),
);
