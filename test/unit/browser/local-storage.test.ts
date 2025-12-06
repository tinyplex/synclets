import {createSynclet} from 'synclets';
import {
  createLocalStorageDataConnector,
  createLocalStorageMetaConnector,
  createLocalStorageSynclet,
} from 'synclets/browser';
import {createMemoryTransport} from 'synclets/memory';
import {getUniqueId} from 'synclets/utils';
import {expect, test} from 'vitest';
import {describeCommonConnectorTests} from '../common.ts';

describeCommonConnectorTests(
  async () => {},
  async () => {},
  (depth: number) =>
    createLocalStorageDataConnector({
      depth,
      dataStorageName: getUniqueId() + '.data',
    }),
  (depth: number) =>
    createLocalStorageMetaConnector({
      depth,
      metaStorageName: getUniqueId() + '.meta',
    }),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);

test('getStorageName', async () => {
  const dataStorageName = getUniqueId() + '.data';
  const dataConnector = createLocalStorageDataConnector({
    depth: 1,
    dataStorageName,
  });

  const metaStorageName = getUniqueId() + '.meta';
  const metaConnector = createLocalStorageMetaConnector({
    depth: 1,
    metaStorageName,
  });

  const synclet = await createSynclet({dataConnector, metaConnector});

  expect(dataConnector.getStorageName()).toEqual(dataStorageName);
  expect(synclet.getDataConnector()!.getStorageName()).toEqual(dataStorageName);
  expect(metaConnector.getStorageName()).toEqual(metaStorageName);
  expect(synclet.getMetaConnector()!.getStorageName()).toEqual(metaStorageName);

  await synclet.destroy();
});

test('createLocalStorageSynclet', async () => {
  const dataStorageName = getUniqueId() + '.data';
  const metaStorageName = getUniqueId() + '.meta';

  const synclet = await createLocalStorageSynclet({
    depth: 1,
    dataStorageName,
    metaStorageName,
  });

  expect(synclet.getDataConnector()!.getStorageName()).toEqual(dataStorageName);
  expect(synclet.getMetaConnector()!.getStorageName()).toEqual(metaStorageName);

  await synclet.destroy();
});
