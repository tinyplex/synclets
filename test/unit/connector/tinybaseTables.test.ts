import {createSynclet} from 'synclets';
import {createMemoryMetaConnector} from 'synclets/connector/memory';
import {createTinyBaseTablesDataConnector} from 'synclets/connector/tinybase';
import {createMemoryTransport} from 'synclets/transport/memory';
import {createStore} from 'tinybase/store';
import {expect, test} from 'vitest';
import {describeSyncletTests} from '../common.ts';

describeSyncletTests(
  'memory',
  async () => {},
  async () => {},
  () => createTinyBaseTablesDataConnector(createStore()),
  (depth: number) => createMemoryMetaConnector(depth),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
  1,
  [3],
);

test('getStore, tables', async () => {
  const store = createStore();
  const dataConnector = createTinyBaseTablesDataConnector(store);
  const synclet = await createSynclet({dataConnector});
  expect(dataConnector.getStore()).toBe(store);
  expect(synclet.getDataConnector().getStore()).toBe(store);
});
