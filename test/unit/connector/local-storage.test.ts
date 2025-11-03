import {createSynclet} from 'synclets';
import {
  createLocalStorageDataConnector,
  createLocalStorageMetaConnector,
} from 'synclets/connector/browser';
import {createMemoryTransport} from 'synclets/transport/memory';
import {getUniqueId} from 'synclets/utils';
import {expect, test} from 'vitest';
import {describeCommonConnectorTests} from '../common.ts';

describeCommonConnectorTests(
  async () => {},
  async () => {},
  (depth: number) =>
    createLocalStorageDataConnector(depth, getUniqueId() + '.data'),
  (depth: number) =>
    createLocalStorageMetaConnector(depth, getUniqueId() + '.meta'),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);

test('getFile', async () => {
  const dataStorageName = getUniqueId() + '.data';
  const dataConnector = createLocalStorageDataConnector(1, dataStorageName);

  const metaStorageName = getUniqueId() + '.meta';
  const metaConnector = createLocalStorageMetaConnector(1, metaStorageName);

  const synclet = await createSynclet({dataConnector, metaConnector});

  expect(dataConnector.getStorageName()).toBe(dataStorageName);
  expect(synclet.getDataConnector().getStorageName()).toBe(dataStorageName);
  expect(metaConnector.getStorageName()).toBe(metaStorageName);
  expect(synclet.getMetaConnector().getStorageName()).toBe(metaStorageName);
});
