import {createSynclet} from 'synclets';
import {createMemoryMetaConnector} from 'synclets/connector/memory';
import {createTinyBaseValuesDataConnector} from 'synclets/connector/tinybase';
import {createMemoryTransport} from 'synclets/transport/memory';
import {createStore} from 'tinybase/store';
import {expect, test} from 'vitest';
import {describeSyncletTests} from '../common.ts';

describeSyncletTests(
  'memory',
  async () => {},
  async () => {},
  () => createTinyBaseValuesDataConnector(createStore()),
  (depth: number) => createMemoryMetaConnector(depth),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
  1,
  [1],
);

test('getStore, values', async () => {
  const store = createStore();
  const dataConnector = createTinyBaseValuesDataConnector(store);
  const synclet = await createSynclet({dataConnector});
  expect(dataConnector.getStore()).toBe(store);
  expect(synclet.getDataConnector().getStore()).toBe(store);
});
