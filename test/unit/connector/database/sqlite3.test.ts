/* eslint-disable max-len */
import {Database} from 'sqlite3';
import {createSynclet} from 'synclets';
import {
  createSqlite3DataConnector,
  createSqlite3MetaConnector,
} from 'synclets/connector/database/sqlite3';
import {createMemoryTransport} from 'synclets/transport/memory';
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest';
import {
  createMockDataConnector,
  createMockMetaConnector,
  describeCommonConnectorTests,
} from '../../common.ts';

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
    createSqlite3DataConnector(depth, new Database(':memory:')),
  <Depth extends number>(depth: Depth) =>
    createSqlite3MetaConnector(depth, new Database(':memory:')),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);

test('getDatabase', async () => {
  const dataDatabase = new Database(':memory:');
  const metaDatabase = new Database(':memory:');

  const dataConnector = createSqlite3DataConnector(1, dataDatabase);
  const metaConnector = createSqlite3MetaConnector(1, metaDatabase);

  const synclet = await createSynclet({dataConnector, metaConnector});

  expect(dataConnector.getDatabase()).toBe(dataDatabase);
  expect(synclet.getDataConnector().getDatabase()).toBe(dataDatabase);

  expect(metaConnector.getDatabase()).toBe(metaDatabase);
  expect(synclet.getMetaConnector().getDatabase()).toBe(metaDatabase);

  dataDatabase.close();
  metaDatabase.close();
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

  // test('create if table missing', async () => {
  //   const logger = {info: vi.fn()};
  //   const dataConnector = createSqlite3DataConnector(3, database);
  //   const metaConnector = createMockMetaConnector(3);
  //   await createSynclet({dataConnector, metaConnector}, {}, {logger, id: ''});
  //   expect((await query(database, `SELECT * FROM data;`).fields).toBe([
  //     {name: 'address', dataTypeID: TEXT},
  //     {name: 'atom', dataTypeID: TEXT},
  //     {name: 'address1', dataTypeID: TEXT},
  //     {name: 'address2', dataTypeID: TEXT},
  //     {name: 'address3', dataTypeID: TEXT},
  //   ]));
  //   expect(logger.info).toHaveBeenCalledWith('[] Creating table "data"');
  // });

  // test('create if table missing, custom options', async () => {
  //   const logger = {info: vi.fn()};
  //   const dataConnector = createSqlite3DataConnector(3, database, {
  //     table: 'd',
  //     addressColumn: 'a',
  //     atomColumn: 'x',
  //   });
  //   const metaConnector = createMockMetaConnector(3);
  //   await createSynclet({dataConnector, metaConnector}, {}, {logger, id: ''});
  //   expect((await query(database, `SELECT * FROM d;`)).fields).toBe([
  //     {name: 'a', dataTypeID: TEXT},
  //     {name: 'x', dataTypeID: TEXT},
  //     {name: 'a1', dataTypeID: TEXT},
  //     {name: 'a2', dataTypeID: TEXT},
  //     {name: 'a3', dataTypeID: TEXT},
  //   ]);
  //   expect(logger.info).toHaveBeenCalledWith('[] Creating table "d"');
  // });

  test('no error if table is correct', async () => {
    await query(
      database,
      `CREATE TABLE data (address TEXT, address1 TEXT, address2 TEXT, address3 TEXT, atom TEXT);`,
    );
    const dataConnector = createSqlite3DataConnector(3, database);
    const metaConnector = createMockMetaConnector(3);
    await createSynclet({dataConnector, metaConnector});
  });

  test('error if table has wrong number of columns', async () => {
    await query(
      database,
      `CREATE TABLE data (address TEXT, address1 TEXT, address2 TEXT, atom TEXT);`,
    );
    const dataConnector = createSqlite3DataConnector(3, database);
    const metaConnector = createMockMetaConnector(3);
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "data" needs correct schema');
  });

  // test('error if table has wrong type of columns', async () => {
  //   await query(
  //     database,
  //     `CREATE TABLE data (address TEXT, address1 TEXT, address2 TEXT, address3 INTEGER, atom TEXT);`,
  //   );
  //   const dataConnector = createSqlite3DataConnector(3, database);
  //   const metaConnector = createMockMetaConnector(3);
  //   await expect(() =>
  //     createSynclet({dataConnector, metaConnector}),
  //   ).rejects.toThrow('Table "data" needs correct schema');
  // });

  test('error if table needs address', async () => {
    await query(
      database,
      `CREATE TABLE data (whoops TEXT, address1 TEXT, address2 TEXT, address3 TEXT, atom TEXT);`,
    );
    const dataConnector = createSqlite3DataConnector(3, database);
    const metaConnector = createMockMetaConnector(3);
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "data" needs correct schema');
  });

  test('error if table needs atom', async () => {
    await query(
      database,
      `CREATE TABLE data (address TEXT, address1 TEXT, address2 TEXT, address3 TEXT, whoops TEXT);`,
    );
    const dataConnector = createSqlite3DataConnector(3, database);
    const metaConnector = createMockMetaConnector(3);
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "data" needs correct schema');
  });

  test('error if table needs addressN', async () => {
    await query(
      database,
      `CREATE TABLE data (address TEXT, address1 TEXT, address2 TEXT, whoops TEXT, atom TEXT);`,
    );
    const dataConnector = createSqlite3DataConnector(3, database);
    const metaConnector = createMockMetaConnector(3);
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

  // test('create if table missing', async () => {
  //   const logger = {info: vi.fn()};
  //   const dataConnector = createMockDataConnector(3);
  //   const metaConnector = createSqlite3MetaConnector(3, database);
  //   await createSynclet({dataConnector, metaConnector}, {}, {logger, id: ''});
  //   expect(await query(database, `SELECT * FROM meta;`).fields).toBe([
  //     {name: 'address', dataTypeID: TEXT},
  //     {name: 'timestamp', dataTypeID: TEXT},
  //     {name: 'address1', dataTypeID: TEXT},
  //     {name: 'address2', dataTypeID: TEXT},
  //     {name: 'address3', dataTypeID: TEXT},
  //   ]);
  //   expect(logger.info).toHaveBeenCalledWith('[] Creating table "meta"');
  // });

  // test('create if table missing, custom options', async () => {
  //   const logger = {info: vi.fn()};
  //   const dataConnector = createMockDataConnector(3);
  //   const metaConnector = createSqlite3MetaConnector(3, database, {
  //     table: 'm',
  //     addressColumn: 'a',
  //     timestampColumn: 't',
  //   });
  //   await createSynclet({dataConnector, metaConnector}, {}, {logger, id: ''});
  //   expect((await query(database, `SELECT * FROM m;`)).fields).toBe([
  //     {name: 'a', dataTypeID: TEXT},
  //     {name: 't', dataTypeID: TEXT},
  //     {name: 'a1', dataTypeID: TEXT},
  //     {name: 'a2', dataTypeID: TEXT},
  //     {name: 'a3', dataTypeID: TEXT},
  //   ]);
  //   expect(logger.info).toHaveBeenCalledWith('[] Creating table "m"');
  // });

  test('no error if table is correct', async () => {
    await query(
      database,
      `CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, address3 TEXT, timestamp TEXT);`,
    );
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createSqlite3MetaConnector(3, database);
    await createSynclet({dataConnector, metaConnector});
  });

  test('error if table has wrong number of columns', async () => {
    await query(
      database,
      `CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, timestamp TEXT);`,
    );
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createSqlite3MetaConnector(3, database);
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  // test('error if table has wrong type of columns', async () => {
  //   await query(
  //     database,
  //     `CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, address3 INTEGER, timestamp TEXT);`,
  //   );
  //   const dataConnector = createMockDataConnector(3);
  //   const metaConnector = createSqlite3MetaConnector(3, database);
  //   await expect(() =>
  //     createSynclet({dataConnector, metaConnector}),
  //   ).rejects.toThrow('Table "meta" needs correct schema');
  // });

  test('error if table needs address', async () => {
    await query(
      database,
      `CREATE TABLE meta (address1 TEXT, address2 TEXT, address3 TEXT, timestamp TEXT);`,
    );
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createSqlite3MetaConnector(3, database);
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  test('error if table needs timestamp', async () => {
    await query(
      database,
      `CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, address3 TEXT);`,
    );
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createSqlite3MetaConnector(3, database);
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  test('error if table needs addressN', async () => {
    await query(
      database,
      `CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, whoops TEXT, timestamp TEXT);`,
    );
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createSqlite3MetaConnector(3, database);
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });
});
