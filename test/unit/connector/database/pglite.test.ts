/* eslint-disable max-len */
import {PGlite} from '@electric-sql/pglite';
import {createSynclet} from 'synclets';
import {
  createPgliteDataConnector,
  createPgliteMetaConnector,
  createPgliteSynclet,
} from 'synclets/connector/database/pglite';
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
import {
  createMockDataConnector,
  createMockMetaConnector,
  describeCommonConnectorTests,
} from '../../common.ts';

const TEXT = 25;

describeCommonConnectorTests(
  async () => await PGlite.create(),
  async () => {},
  <Depth extends number>(depth: Depth, pglite: PGlite) =>
    createPgliteDataConnector({
      depth,
      pglite,
      dataTable: 'data' + getUniqueId(),
    }),
  <Depth extends number>(depth: Depth, pglite: PGlite) =>
    createPgliteMetaConnector({
      depth,
      pglite,
      metaTable: 'meta' + getUniqueId(),
    }),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);

test('getPglite', async () => {
  const dataPglite = await PGlite.create();
  const metaPglite = await PGlite.create();

  const dataConnector = createPgliteDataConnector({
    depth: 1,
    pglite: dataPglite,
  });
  const metaConnector = createPgliteMetaConnector({
    depth: 1,
    pglite: metaPglite,
  });

  const synclet = await createSynclet({dataConnector, metaConnector});

  expect(dataConnector.getPglite()).toEqual(dataPglite);
  expect(synclet.getDataConnector()!.getPglite()).toEqual(dataPglite);

  expect(metaConnector.getPglite()).toEqual(metaPglite);
  expect(synclet.getMetaConnector()!.getPglite()).toEqual(metaPglite);

  await dataPglite.close();
  await metaPglite.close();

  await synclet.destroy();
});

test('getPglite, synclet', async () => {
  const pglite = await PGlite.create();
  const synclet = await createPgliteSynclet({
    depth: 1,
    pglite,
  });

  expect(synclet.getDataConnector()!.getPglite()).toEqual(pglite);
  expect(synclet.getMetaConnector()!.getPglite()).toEqual(pglite);
  expect(synclet.getMetaConnector()!.getPglite()).toEqual(pglite);
  await pglite.close();

  await synclet.destroy();
});

describe('data schema checks', async () => {
  let pglite: PGlite;

  beforeAll(async () => {
    pglite = await PGlite.create();
  });

  afterEach(async () => await pglite.sql`DROP TABLE IF EXISTS data;`);

  afterAll(async () => {
    await pglite.close();
  });

  test('create if table missing', async () => {
    const logger = {info: vi.fn()};
    const dataConnector = createPgliteDataConnector({depth: 3, pglite});
    const metaConnector = createMockMetaConnector(3);
    const synclet = await createSynclet(
      {dataConnector, metaConnector},
      {},
      {logger, id: ''},
    );
    expect((await pglite.sql`SELECT * FROM data;`).fields).toEqual([
      {name: 'address', dataTypeID: TEXT},
      {name: 'atom', dataTypeID: TEXT},
      {name: 'address1', dataTypeID: TEXT},
      {name: 'address2', dataTypeID: TEXT},
      {name: 'address3', dataTypeID: TEXT},
    ]);
    expect(logger.info).toHaveBeenCalledWith('[] Creating table "data"');
    await synclet.destroy();
  });

  test('create if table missing, custom options', async () => {
    const logger = {info: vi.fn()};
    const dataConnector = createPgliteDataConnector({
      depth: 3,
      pglite,
      dataTable: 'd',
      addressColumn: 'a',
      atomColumn: 'x',
    });
    const metaConnector = createMockMetaConnector(3);
    const synclet = await createSynclet(
      {dataConnector, metaConnector},
      {},
      {logger, id: ''},
    );
    expect((await pglite.sql`SELECT * FROM d;`).fields).toEqual([
      {name: 'a', dataTypeID: TEXT},
      {name: 'x', dataTypeID: TEXT},
      {name: 'a1', dataTypeID: TEXT},
      {name: 'a2', dataTypeID: TEXT},
      {name: 'a3', dataTypeID: TEXT},
    ]);
    expect(logger.info).toHaveBeenCalledWith('[] Creating table "d"');
    await synclet.destroy();
  });

  test('no error if table is correct', async () => {
    await pglite.sql`CREATE TABLE data (address TEXT, address1 TEXT, address2 TEXT, address3 TEXT, atom TEXT);`;
    const dataConnector = createPgliteDataConnector({depth: 3, pglite});
    const metaConnector = createMockMetaConnector(3);
    const synclet = await createSynclet({dataConnector, metaConnector});
    await synclet.destroy();
  });

  test('error if table has wrong number of columns', async () => {
    await pglite.sql`CREATE TABLE data (address TEXT, address1 TEXT, address2 TEXT, atom TEXT);`;
    const dataConnector = createPgliteDataConnector({depth: 3, pglite});
    const metaConnector = createMockMetaConnector(3);
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "data" needs correct schema');
  });

  test('error if table has wrong type of columns', async () => {
    await pglite.sql`CREATE TABLE data (address TEXT, address1 TEXT, address2 TEXT, address3 INTEGER, atom TEXT);`;
    const dataConnector = createPgliteDataConnector({depth: 3, pglite});
    const metaConnector = createMockMetaConnector(3);
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "data" needs correct schema');
  });

  test('error if table needs address', async () => {
    await pglite.sql`CREATE TABLE data (whoops TEXT, address1 TEXT, address2 TEXT, address3 TEXT, atom TEXT);`;
    const dataConnector = createPgliteDataConnector({depth: 3, pglite});
    const metaConnector = createMockMetaConnector(3);
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "data" needs correct schema');
  });

  test('error if table needs atom', async () => {
    await pglite.sql`CREATE TABLE data (address TEXT, address1 TEXT, address2 TEXT, address3 TEXT, whoops TEXT);`;
    const dataConnector = createPgliteDataConnector({depth: 3, pglite});
    const metaConnector = createMockMetaConnector(3);
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "data" needs correct schema');
  });

  test('error if table needs addressN', async () => {
    await pglite.sql`CREATE TABLE data (address TEXT, address1 TEXT, address2 TEXT, whoops TEXT, atom TEXT);`;
    const dataConnector = createPgliteDataConnector({depth: 3, pglite});
    const metaConnector = createMockMetaConnector(3);
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "data" needs correct schema');
  });
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
    const metaConnector = createPgliteMetaConnector({depth: 3, pglite});
    const synclet = await createSynclet(
      {dataConnector, metaConnector},
      {},
      {logger, id: ''},
    );
    expect((await pglite.sql`SELECT * FROM meta;`).fields).toEqual([
      {name: 'address', dataTypeID: TEXT},
      {name: 'timestamp', dataTypeID: TEXT},
      {name: 'address1', dataTypeID: TEXT},
      {name: 'address2', dataTypeID: TEXT},
      {name: 'address3', dataTypeID: TEXT},
    ]);
    expect(logger.info).toHaveBeenCalledWith('[] Creating table "meta"');
    await synclet.destroy();
  });

  test('create if table missing, custom options', async () => {
    const logger = {info: vi.fn()};
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector({
      depth: 3,
      pglite,
      metaTable: 'm',
      addressColumn: 'a',
      timestampColumn: 't',
    });
    const synclet = await createSynclet(
      {dataConnector, metaConnector},
      {},
      {logger, id: ''},
    );
    expect((await pglite.sql`SELECT * FROM m;`).fields).toEqual([
      {name: 'a', dataTypeID: TEXT},
      {name: 't', dataTypeID: TEXT},
      {name: 'a1', dataTypeID: TEXT},
      {name: 'a2', dataTypeID: TEXT},
      {name: 'a3', dataTypeID: TEXT},
    ]);
    expect(logger.info).toHaveBeenCalledWith('[] Creating table "m"');
    await synclet.destroy();
  });

  test('no error if table is correct', async () => {
    await pglite.sql`CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, address3 TEXT, timestamp TEXT);`;
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector({depth: 3, pglite});
    const synclet = await createSynclet({dataConnector, metaConnector});
    await synclet.destroy();
  });

  test('error if table has wrong number of columns', async () => {
    await pglite.sql`CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, timestamp TEXT);`;
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector({depth: 3, pglite});
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  test('error if table has wrong type of columns', async () => {
    await pglite.sql`CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, address3 INTEGER, timestamp TEXT);`;
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector({depth: 3, pglite});
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  test('error if table needs address', async () => {
    await pglite.sql`CREATE TABLE meta (whoops TEXT, address1 TEXT, address2 TEXT, address3 TEXT, timestamp TEXT);`;
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector({depth: 3, pglite});
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  test('error if table needs timestamp', async () => {
    await pglite.sql`CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, address3 TEXT, whoops TEXT);`;
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector({depth: 3, pglite});
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });

  test('error if table needs addressN', async () => {
    await pglite.sql`CREATE TABLE meta (address TEXT, address1 TEXT, address2 TEXT, whoops TEXT, timestamp TEXT);`;
    const dataConnector = createMockDataConnector(3);
    const metaConnector = createPgliteMetaConnector({depth: 3, pglite});
    await expect(() =>
      createSynclet({dataConnector, metaConnector}),
    ).rejects.toThrow('Table "meta" needs correct schema');
  });
});
