import {createSynclet} from 'synclets';
import {
  createSessionStorageDataConnector,
  createSessionStorageMetaConnector,
  createSessionStorageSynclet,
} from 'synclets/connector/browser';
import {createMemoryTransport} from 'synclets/transport/memory';
import {getUniqueId} from 'synclets/utils';
import {expect, test} from 'vitest';
import {describeCommonConnectorTests} from '../common.ts';

describeCommonConnectorTests(
  async () => {},
  async () => {},
  (depth: number) =>
    createSessionStorageDataConnector({
      depth,
      dataStorageName: getUniqueId() + '.data',
    }),
  (depth: number) =>
    createSessionStorageMetaConnector({
      depth,
      metaStorageName: getUniqueId() + '.meta',
    }),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);

test('getStorageName', async () => {
  const dataStorageName = getUniqueId() + '.data';
  const dataConnector = createSessionStorageDataConnector({
    depth: 1,
    dataStorageName,
  });

  const metaStorageName = getUniqueId() + '.meta';
  const metaConnector = createSessionStorageMetaConnector({
    depth: 1,
    metaStorageName,
  });

  const synclet = await createSynclet({dataConnector, metaConnector});

  expect(dataConnector.getStorageName()).toEqual(dataStorageName);
  expect(synclet.getDataConnector().getStorageName()).toEqual(dataStorageName);
  expect(metaConnector.getStorageName()).toEqual(metaStorageName);
  expect(synclet.getMetaConnector().getStorageName()).toEqual(metaStorageName);

  await synclet.destroy();
});

test('createSessionStorageSynclet', async () => {
  const dataStorageName = getUniqueId() + '.data';
  const metaStorageName = getUniqueId() + '.meta';

  const synclet = await createSessionStorageSynclet({
    depth: 1,
    dataStorageName,
    metaStorageName,
  });

  expect(synclet.getDataConnector().getStorageName()).toEqual(dataStorageName);
  expect(synclet.getMetaConnector().getStorageName()).toEqual(metaStorageName);

  await synclet.destroy();
});
