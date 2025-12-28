/* eslint-disable max-len */
import {PGlite} from '@electric-sql/pglite';
import {createSynclet} from 'synclets';
import {createMemoryTransport} from 'synclets/memory';
import {
  createPgliteDataConnector,
  createPgliteMetaConnector,
  createPgliteSynclet,
  getTableSchema,
} from 'synclets/pglite';
import {getUniqueId} from 'synclets/utils';
import {expect, test} from 'vitest';
import {describeCommonSyncletTests, describeSchemaTests} from '../common.ts';

describeCommonSyncletTests(
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

test('getTableSchema', async () => {
  const pglite = await PGlite.create();
  await pglite.sql`CREATE TABLE test_table (id INTEGER, name TEXT, value REAL);`;

  const schema = await getTableSchema(pglite, 'test_table');

  expect(schema).toEqual({
    id: 'integer',
    name: 'text',
    value: 'real',
  });

  await pglite.close();
});

describeSchemaTests(
  'pglite',
  () => PGlite.create(),
  (pglite) => pglite.close(),
  (pglite, sql) => pglite.query(sql),
  (pglite, table) => getTableSchema(pglite, table),
  (db, options) => createPgliteDataConnector({pglite: db, ...options}),
  (db, options) => createPgliteMetaConnector({pglite: db, ...options}),
);
