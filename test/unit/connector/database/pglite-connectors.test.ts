import {PGlite} from '@electric-sql/pglite';
import {createSynclet} from 'synclets';
import {createPgliteConnectors} from 'synclets/connector/database/pglite';
import {describe, expect, test} from 'vitest';

describe('createPgliteConnectors', () => {
  test('creates both connectors from single database', async () => {
    const pglite = await PGlite.create();

    const connectors = createPgliteConnectors(1, pglite);

    const synclet = await createSynclet({connectors});

    expect(synclet.getDataConnector().getPglite()).toEqual(pglite);
    expect(synclet.getMetaConnector().getPglite()).toEqual(pglite);

    await synclet.setAtom(['test'], 'value');
    expect(await synclet.getData()).toEqual({test: 'value'});

    await pglite.close();
    await synclet.destroy();
  });

  test('uses custom table names', async () => {
    const pglite = await PGlite.create();

    const connectors = createPgliteConnectors(1, pglite, {
      dataTable: 'my_data',
      metaTable: 'my_meta',
    });

    const synclet = await createSynclet({connectors});

    await synclet.setAtom(['test'], 'value');

    const tables = await pglite.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
    );
    const tableNames = tables.rows.map((r: any) => r.tablename);

    expect(tableNames).toContain('my_data');
    expect(tableNames).toContain('my_meta');

    await pglite.close();
    await synclet.destroy();
  });

  test('backward compatibility - separate connectors still work', async () => {
    const pglite = await PGlite.create();

    // Use the old API explicitly
    const {createPgliteDataConnector, createPgliteMetaConnector} = await import(
      'synclets/connector/database/pglite'
    );

    const dataConnector = createPgliteDataConnector(1, pglite);
    const metaConnector = createPgliteMetaConnector(1, pglite);

    const synclet = await createSynclet({dataConnector, metaConnector});

    await synclet.setAtom(['test'], 'value');
    expect(await synclet.getData()).toEqual({test: 'value'});

    await pglite.close();
    await synclet.destroy();
  });

  test('can mix connectors from different sources', async () => {
    const dataPglite = await PGlite.create();
    const metaPglite = await PGlite.create();

    const {createPgliteDataConnector, createPgliteMetaConnector} = await import(
      'synclets/connector/database/pglite'
    );

    const dataConnector = createPgliteDataConnector(1, dataPglite);
    const metaConnector = createPgliteMetaConnector(1, metaPglite);

    const synclet = await createSynclet({dataConnector, metaConnector});

    expect(synclet.getDataConnector().getPglite()).toEqual(dataPglite);
    expect(synclet.getMetaConnector().getPglite()).toEqual(metaPglite);

    await synclet.setAtom(['test'], 'value');
    expect(await synclet.getData()).toEqual({test: 'value'});

    await dataPglite.close();
    await metaPglite.close();
    await synclet.destroy();
  });
});
