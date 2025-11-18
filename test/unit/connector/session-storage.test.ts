import {createSynclet} from 'synclets';
import {
  createSessionStorageDataConnector,
  createSessionStorageMetaConnector,
} from 'synclets/connector/browser';
import {createMemoryTransport} from 'synclets/transport/memory';
import {getUniqueId} from 'synclets/utils';
import {expect, test} from 'vitest';
import {describeCommonConnectorTests} from '../common.ts';

describeCommonConnectorTests(
  async () => {},
  async () => {},
  (depth: number) =>
    createSessionStorageDataConnector(depth, getUniqueId() + '.data'),
  (depth: number) =>
    createSessionStorageMetaConnector(depth, getUniqueId() + '.meta'),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);

test('getFile', async () => {
  const dataStorageName = getUniqueId() + '.data';
  const dataConnector = createSessionStorageDataConnector(1, dataStorageName);

  const metaStorageName = getUniqueId() + '.meta';
  const metaConnector = createSessionStorageMetaConnector(1, metaStorageName);

  const synclet = await createSynclet({dataConnector, metaConnector});

  expect(dataConnector.getStorageName()).toEqual(dataStorageName);
  expect(synclet.getDataConnector().getStorageName()).toEqual(dataStorageName);
  expect(metaConnector.getStorageName()).toEqual(metaStorageName);
  expect(synclet.getMetaConnector().getStorageName()).toEqual(metaStorageName);

  await synclet.destroy();
});
