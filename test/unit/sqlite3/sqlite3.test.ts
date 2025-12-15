/* eslint-disable max-len */
import {Database} from 'sqlite3';
import {createSynclet} from 'synclets';
import {createMemoryTransport} from 'synclets/memory';
import {
  createSqlite3DataConnector,
  createSqlite3MetaConnector,
  createSqlite3Synclet,
  getTableSchema,
} from 'synclets/sqlite3';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import {
  createMockDataConnector,
  createMockMetaConnector,
  describeCommonConnectorTests,
} from '../common.ts';

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

describeCommonConnectorTests(
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

describe('data schema checks', async () => {
  let database: Database;

  beforeAll(async () => {
    database = new Database(':memory:');
  });

  afterEach(async () => await query(database, `DROP TABLE IF EXISTS data;`));

  afterAll(async () => {
    database.close();
  });

  test('create if table missing', async () => {
    const logger = {info: vi.fn()};
    const dataConnector = createSqlite3DataConnector({depth: 3, database});
    const metaConnector = createMockMetaConnector({depth: 3});
    const synclet = await createSynclet(
      {dataConnector, metaConnector},
      {},
      {logger, id: ''},
    );
    const columns = await query<{name: string; type: string}>(
      database,
      `PRAGMA table_info(data);`,
    );
    expect(columns.map((col) => col.name)).toEqual([
      'address',
      'atom',
      'address1',
      'address2',
      'address3',
    ]);
    expect(columns.every((col) => col.type === 'TEXT')).toBe(true);
    expect(logger.info).toHaveBeenCalledWith('[] Creating table "data"');
    await synclet.destroy();
  });

  test('create if table missing, custom options', async () => {
    const logger = {info: vi.fn()};
    const dataConnector = createSqlite3DataConnector({
      depth: 3,
      database,
      dataTable: 'd',
      addressColumn: 'a',
      atomColumn: 'x',
    });
    const metaConnector = createMockMetaConnector({depth: 3});
    const synclet = await createSynclet(
      {dataConnector, metaConnector},
      {},
      {logger, id: ''},
    );

    // Verify the table was created with custom column names
    const columns = await query<{name: string; type: string}>(
      database,
      `PRAGMA table_info(d);`,
    );
    expect(columns.map((col) => col.name)).toEqual([
      'a',
      'x',
      'a1',
      'a2',
      'a3',
    ]);
    expect(columns.every((col) => col.type === 'TEXT')).toBe(true);
    expect(logger.info).toHaveBeenCalledWith('[] Creating table "d"');

    await synclet.destroy();
  });

  test('no error if table is correct', async () => {
    await query(
      database,
      `CREATE TABLE data (address TEXT, address1 TEXT, address2 TEXT, address3 TEXT, atom TEXT);`,
    );
    const dataConnector = createSqlite3DataConnector({depth: 3, database});
    const metaConnector = createMockMetaConnector({depth: 3});
    const synclet = await createSynclet({dataConnector, metaConnector});
    await synclet.destroy();
  });

  test('error if table has wrong number of columns', async () => {
    await query(
      database,
      `CREATE TABLE data (address TEXT, address1 TEXT, address2 TEXT, atom TEXT);`,
    );
    const dataConnector = createSqlite3DataConnector({depth: 3, database});
    const metaConnector = createMockMetaConnector({depth: 3});
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "data" needs correct schema');
  });

  test('error if table has wrong type of columns', async () => {
    await query(
      database,
      `CREATE TABLE data (address TEXT, address1 TEXT, address2 TEXT, address3 INTEGER, atom TEXT);`,
    );
    const dataConnector = createSqlite3DataConnector({depth: 3, database});
    const metaConnector = createMockMetaConnector({depth: 3});
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "data" needs correct schema');
  });

  test('error if table needs address', async () => {
    await query(
      database,
      `CREATE TABLE data (whoops TEXT, address1 TEXT, address2 TEXT, address3 TEXT, atom TEXT);`,
    );
    const dataConnector = createSqlite3DataConnector({depth: 3, database});
    const metaConnector = createMockMetaConnector({depth: 3});
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "data" needs correct schema');
  });

  test('error if table needs atom', async () => {
    await query(
      database,
      `CREATE TABLE data (address TEXT, address1 TEXT, address2 TEXT, address3 TEXT, whoops TEXT);`,
    );
    const dataConnector = createSqlite3DataConnector({depth: 3, database});
    const metaConnector = createMockMetaConnector({depth: 3});
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "data" needs correct schema');
  });

  test('error if table needs addressN', async () => {
    await query(
      database,
      `CREATE TABLE data (address TEXT, address1 TEXT, address2 TEXT, whoops TEXT, atom TEXT);`,
    );
    const dataConnector = createSqlite3DataConnector({depth: 3, database});
    const metaConnector = createMockMetaConnector({depth: 3});
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "data" needs correct schema');
  });
});

describe('meta schema checks', async () => {
  let database: Database;

  beforeAll(async () => {
    database = new Database(':memory:');
  });

  afterEach(async () => await query(database, `DROP TABLE IF EXISTS meta;`));

  afterAll(async () => {
    database.close();
  });

  test('create if table missing', async () => {
    const logger = {info: vi.fn()};
    const dataConnector = createMockDataConnector({depth: 3});
    const metaConnector = createSqlite3MetaConnector({depth: 3, database});
    const synclet = await createSynclet(
      {dataConnector, metaConnector},
      {},
      {logger, id: ''},
    );
    const columns = await query<{name: string; type: string}>(
      database,
      `PRAGMA table_info(meta);`,
    );
    expect(columns.map((col) => col.name)).toEqual([
      'address',
      'timestamp',
      'address1',
      'address2',
      'address3',
    ]);
    expect(columns.every((col) => col.type === 'TEXT')).toBe(true);
    expect(logger.info).toHaveBeenCalledWith('[] Creating table "meta"');
    await synclet.destroy();
  });

  test('create if table missing, custom options', async () => {
    const logger = {info: vi.fn()};
    const dataConnector = createMockDataConnector({depth: 3});
    const metaConnector = createSqlite3MetaConnector({
      depth: 3,
      database,
      metaTable: 'm',
      addressColumn: 'a',
      timestampColumn: 't',
    });
    const synclet = await createSynclet(
      {dataConnector, metaConnector},
      {},
      {logger, id: ''},
    );
    const columns = await query<{name: string; type: string}>(
      database,
      `PRAGMA table_info(m);`,
    );
    expect(columns.map((col) => col.name)).toEqual([
      'a',
      't',
      'a1',
      'a2',
      'a3',
    ]);
    expect(columns.every((col) => col.type === 'TEXT')).toBe(true);
    expect(logger.info).toHaveBeenCalledWith('[] Creating table "m"');
    await synclet.destroy();
  });

  test('no error if table is correct', async () => {
    await query(
      database,
      `CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, address3 TEXT, timestamp TEXT);`,
    );
    const dataConnector = createMockDataConnector({depth: 3});
    const metaConnector = createSqlite3MetaConnector({depth: 3, database});
    const synclet = await createSynclet({dataConnector, metaConnector});
    await synclet.destroy();
  });

  test('error if table has wrong number of columns', async () => {
    await query(
      database,
      `CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, timestamp TEXT);`,
    );
    const dataConnector = createMockDataConnector({depth: 3});
    const metaConnector = createSqlite3MetaConnector({depth: 3, database});
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  test('error if table has wrong type of columns', async () => {
    await query(
      database,
      `CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, address3 INTEGER, timestamp TEXT);`,
    );
    const dataConnector = createMockDataConnector({depth: 3});
    const metaConnector = createSqlite3MetaConnector({depth: 3, database});
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  test('error if table needs address', async () => {
    await query(
      database,
      `CREATE TABLE meta (whoops TEXT, address1 TEXT, address2 TEXT, address3 TEXT, timestamp TEXT);`,
    );
    const dataConnector = createMockDataConnector({depth: 3});
    const metaConnector = createSqlite3MetaConnector({depth: 3, database});
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  test('error if table needs timestamp', async () => {
    await query(
      database,
      `CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, address3 TEXT, whoops TEXT);`,
    );
    const dataConnector = createMockDataConnector({depth: 3});
    const metaConnector = createSqlite3MetaConnector({depth: 3, database});
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  test('error if table needs addressN', async () => {
    await query(
      database,
      `CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, whoops TEXT, timestamp TEXT);`,
    );
    const dataConnector = createMockDataConnector({depth: 3});
    const metaConnector = createSqlite3MetaConnector({depth: 3, database});
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });
});
