import {createSynclet} from 'synclets';
import {
  createLocalStorageConnectors,
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

test('getStorageName', async () => {
  const dataStorageName = getUniqueId() + '.data';
  const dataConnector = createLocalStorageDataConnector(1, dataStorageName);

  const metaStorageName = getUniqueId() + '.meta';
  const metaConnector = createLocalStorageMetaConnector(1, metaStorageName);

  const synclet = await createSynclet({dataConnector, metaConnector});

  expect(dataConnector.getStorageName()).toEqual(dataStorageName);
  expect(synclet.getDataConnector().getStorageName()).toEqual(dataStorageName);
  expect(metaConnector.getStorageName()).toEqual(metaStorageName);
  expect(synclet.getMetaConnector().getStorageName()).toEqual(metaStorageName);

  await synclet.destroy();
});

test('getStorageName, connectors', async () => {
  const dataStorageName = getUniqueId() + '.data';
  const metaStorageName = getUniqueId() + '.meta';

  const connectors = createLocalStorageConnectors(
    1,
    dataStorageName,
    metaStorageName,
  );
  const synclet = await createSynclet({connectors});

  expect(connectors.getDataConnector().getStorageName()).toEqual(
    dataStorageName,
  );
  expect(synclet.getDataConnector().getStorageName()).toEqual(dataStorageName);
  expect(connectors.getMetaConnector().getStorageName()).toEqual(
    metaStorageName,
  );
  expect(synclet.getMetaConnector().getStorageName()).toEqual(metaStorageName);

  await synclet.destroy();
});
