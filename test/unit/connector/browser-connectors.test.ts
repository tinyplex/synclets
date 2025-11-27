import {createSynclet} from 'synclets';
import {
  createLocalStorageConnectors,
  createSessionStorageConnectors,
} from 'synclets/connector/browser';
import {describe, expect, test} from 'vitest';

describe('Browser Storage Connectors', () => {
  test('createLocalStorageConnectors with single storage name', async () => {
    const storageName = 'test-local-storage';
    const connectors = createLocalStorageConnectors(1, storageName);

    const synclet = await createSynclet({connectors});

    expect(synclet.getDataConnector().getStorageName()).toEqual(storageName);
    expect(synclet.getMetaConnector().getStorageName()).toEqual(storageName);

    await synclet.setAtom(['test'], 'value');
    expect(await synclet.getData()).toEqual({test: 'value'});

    await synclet.destroy();
  });

  test('createLocalStorageConnectors with separate storage names', async () => {
    const dataStorageName = 'test-local-data';
    const metaStorageName = 'test-local-meta';

    const connectors = createLocalStorageConnectors(1, dataStorageName, {
      dataStorageName,
      metaStorageName,
    });

    const synclet = await createSynclet({connectors});

    expect(synclet.getDataConnector().getStorageName()).toEqual(
      dataStorageName,
    );
    expect(synclet.getMetaConnector().getStorageName()).toEqual(
      metaStorageName,
    );

    await synclet.setAtom(['test'], 'value');
    expect(await synclet.getData()).toEqual({test: 'value'});

    await synclet.destroy();
  });

  test('createSessionStorageConnectors with single storage name', async () => {
    const storageName = 'test-session-storage';
    const connectors = createSessionStorageConnectors(1, storageName);

    const synclet = await createSynclet({connectors});

    expect(synclet.getDataConnector().getStorageName()).toEqual(storageName);
    expect(synclet.getMetaConnector().getStorageName()).toEqual(storageName);

    await synclet.setAtom(['test'], 'value');
    expect(await synclet.getData()).toEqual({test: 'value'});

    await synclet.destroy();
  });

  test('createSessionStorageConnectors with separate names', async () => {
    const dataStorageName = 'test-session-data';
    const metaStorageName = 'test-session-meta';

    const connectors = createSessionStorageConnectors(1, dataStorageName, {
      dataStorageName,
      metaStorageName,
    });

    const synclet = await createSynclet({connectors});

    expect(synclet.getDataConnector().getStorageName()).toEqual(
      dataStorageName,
    );
    expect(synclet.getMetaConnector().getStorageName()).toEqual(
      metaStorageName,
    );

    await synclet.setAtom(['test'], 'value');
    expect(await synclet.getData()).toEqual({test: 'value'});

    await synclet.destroy();
  });
});
