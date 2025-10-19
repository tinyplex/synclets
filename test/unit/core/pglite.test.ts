import {PGlite} from '@electric-sql/pglite';
import {createSynclet} from 'synclets';
import {createMemoryDataConnector} from 'synclets/connector/memory';
import {createPgliteMetaConnector} from 'synclets/connector/pglite';
import {createMemoryTransport} from 'synclets/transport/memory';
import {getUniqueId} from 'synclets/utils';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import {createMockDataConnector, describeSyncletTests} from '../common.ts';

const TEXT = 25;

test('getPglite', async () => {
  const metaPglite = await PGlite.create();

  const dataConnector = createMockDataConnector(1);

  const metaConnector = createPgliteMetaConnector(1, metaPglite);
  const synclet = await createSynclet({dataConnector, metaConnector});

  expect(metaConnector.getPglite()).toBe(metaPglite);
  expect(synclet.getMetaConnector().getPglite()).toBe(metaPglite);

  await metaPglite.close();
});

describe('meta schema checks', async () => {
  let pglite: PGlite;

  beforeAll(async () => {
    pglite = await PGlite.create();
  });

  afterEach(async () => await pglite.sql`DROP TABLE IF EXISTS meta;`);

  afterAll(async () => {
    await pglite.close();
  });

  test('create if table missing', async () => {
    const logger = {info: vi.fn()};
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector(3, pglite);
    await createSynclet({dataConnector, metaConnector}, {}, {logger, id: ''});
    expect((await pglite.sql`SELECT * FROM meta;`).fields).toEqual([
      {name: 'address', dataTypeID: TEXT},
      {name: 'timestamp', dataTypeID: TEXT},
      {name: 'address1', dataTypeID: TEXT},
      {name: 'address2', dataTypeID: TEXT},
      {name: 'address3', dataTypeID: TEXT},
    ]);
    expect(logger.info).toHaveBeenCalledWith('[] Creating table "meta"');
  });

  test('create if table missing, custom options', async () => {
    const logger = {info: vi.fn()};
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector(3, pglite, {
      table: 'm',
      addressColumn: 'a',
      timestampColumn: 't',
    });
    await createSynclet({dataConnector, metaConnector}, {}, {logger, id: ''});
    expect((await pglite.sql`SELECT * FROM m;`).fields).toEqual([
      {name: 'a', dataTypeID: TEXT},
      {name: 't', dataTypeID: TEXT},
      {name: 'a1', dataTypeID: TEXT},
      {name: 'a2', dataTypeID: TEXT},
      {name: 'a3', dataTypeID: TEXT},
    ]);
    expect(logger.info).toHaveBeenCalledWith('[] Creating table "m"');
  });

  test('no error if table is correct', async () => {
    await pglite.sql`CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, address3 TEXT, timestamp TEXT);`;
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector(3, pglite);
    await createSynclet({dataConnector, metaConnector});
  });

  test('error if table has wrong number of columns', async () => {
    await pglite.sql`CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, timestamp TEXT);`;
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector(3, pglite);
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  test('error if table has wrong type of columns', async () => {
    await pglite.sql`CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, address3 INTEGER, timestamp TEXT);`;
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector(3, pglite);
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  test('error if table needs address', async () => {
    await pglite.sql`CREATE TABLE meta (whoops TEXT, address1 TEXT, address2 TEXT, address3 TEXT, timestamp TEXT);`;
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector(3, pglite);
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  test('error if table needs timestamp', async () => {
    await pglite.sql`CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, address3 TEXT, whoops TEXT);`;
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector(3, pglite);
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  test('error if table needs addressN', async () => {
    await pglite.sql`CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, whoops TEXT, timestamp TEXT);`;
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector(3, pglite);
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });
});

const pglite = await PGlite.create();
describeSyncletTests(
  'memory/pglite/memory',
  async () => {},
  async () => {},
  <Depth extends number>(depth: Depth) => createMemoryDataConnector(depth),
  <Depth extends number>(depth: Depth) =>
    createPgliteMetaConnector(depth, pglite, {table: 'meta' + getUniqueId()}),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
  0,
);
