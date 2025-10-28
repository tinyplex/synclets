import {createSynclet} from 'synclets';
import {createMemoryMetaConnector} from 'synclets/connector/memory';
import {createTinyBaseTablesDataConnector} from 'synclets/connector/tinybase';
import {createMemoryTransport} from 'synclets/transport/memory';
import {getUniqueId} from 'tinybase';
import {createStore} from 'tinybase/store';
import {expect, test} from 'vitest';
import {describeSyncletTests, pause} from '../common.ts';

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

test.only('reactive', async () => {
  const poolId = getUniqueId();

  const store1 = createStore();
  const dataConnector1 = createTinyBaseTablesDataConnector(store1);
  const synclet1 = await createSynclet({
    dataConnector: dataConnector1,
    transport: createMemoryTransport({poolId}),
  });
  await synclet1.start();

  const store2 = createStore();
  const dataConnector2 = createTinyBaseTablesDataConnector(store2);
  const synclet2 = await createSynclet({
    dataConnector: dataConnector2,
    transport: createMemoryTransport({poolId}),
  });
  await synclet2.start();

  store1.setCell('t1', 'r1', 'c1', 'c1');
  await pause(1);
  expect(store2.getTables()).toEqual({t1: {r1: {c1: 'c1'}}});
});
