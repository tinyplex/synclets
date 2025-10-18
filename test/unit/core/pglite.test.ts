import {PGlite} from '@electric-sql/pglite';
import {createSynclet} from 'synclets';
import {createPgliteMetaConnector} from 'synclets/connector/pglite';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import {createMockDataConnector} from '../common.ts';

const TEXT = 25;

let metaPglite: PGlite;

beforeAll(async () => {
  metaPglite = await PGlite.create();
});

afterEach(async () => await metaPglite.sql`DROP TABLE meta;`);

afterAll(async () => {
  await metaPglite.close();
});

test('getPglite', async () => {
  const dataConnector = createMockDataConnector(1);

  const metaConnector = createPgliteMetaConnector(1, metaPglite, 'meta');
  const synclet = await createSynclet({dataConnector, metaConnector});

  expect(metaConnector.getPglite()).toBe(metaPglite);
  expect(synclet.getMetaConnector().getPglite()).toBe(metaPglite);
});

describe('meta schema checks', async () => {
  test('create if table missing', async () => {
    const logger = {info: vi.fn()};
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector(3, metaPglite, 'meta');
    await createSynclet({dataConnector, metaConnector}, {}, {logger, id: ''});
    expect((await metaPglite.sql`SELECT * FROM meta;`).fields).toEqual([
      {name: 'address', dataTypeID: TEXT},
      {name: 'address1', dataTypeID: TEXT},
      {name: 'address2', dataTypeID: TEXT},
      {name: 'address3', dataTypeID: TEXT},
      {name: 'timestamp', dataTypeID: TEXT},
    ]);
    expect(logger.info).toHaveBeenCalledWith('[] Creating table "meta"');
  });

  test('no error if table is correct', async () => {
    await metaPglite.sql`CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, address3 TEXT, timestamp TEXT);`;
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector(3, metaPglite, 'meta');
    await createSynclet({dataConnector, metaConnector});
  });

  test('error if table has wrong number of columns', async () => {
    await metaPglite.sql`CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, timestamp TEXT);`;
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector(3, metaPglite, 'meta');
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  test('error if table has wrong type of columns', async () => {
    await metaPglite.sql`CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, address3 INTEGER, timestamp TEXT);`;
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector(3, metaPglite, 'meta');
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  test('error if table needs address', async () => {
    await metaPglite.sql`CREATE TABLE meta (whoops TEXT, address1 TEXT, address2 TEXT, address3 TEXT, timestamp TEXT);`;
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector(3, metaPglite, 'meta');
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  test('error if table needs timestamp', async () => {
    await metaPglite.sql`CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, address3 TEXT, whoops TEXT);`;
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector(3, metaPglite, 'meta');
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  test('error if table needs addressN', async () => {
    await metaPglite.sql`CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, whoops TEXT, timestamp TEXT);`;
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector(3, metaPglite, 'meta');
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });
});
