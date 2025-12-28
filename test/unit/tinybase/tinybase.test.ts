import {createSynclet, type Synclet} from 'synclets';
import {
  createMemoryMetaConnector,
  createMemoryTransport,
} from 'synclets/memory';
import {
  createTinyBaseDataConnector,
  createTinyBaseSynclet,
} from 'synclets/tinybase';
import {createStore, getUniqueId, type Store} from 'tinybase';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {describeCommonSyncletTests, getTimeFunctions} from '../common.ts';

const [reset, getNow, pause] = getTimeFunctions();

describeCommonSyncletTests(
  async () => {},
  async () => {},
  () => createTinyBaseDataConnector({store: createStore()}),
  (depth: number) => createMemoryMetaConnector({depth}),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
  0,
  [3],
);

test('getStore, tables', async () => {
  const store = createStore();
  const dataConnector = createTinyBaseDataConnector({store});
  const metaConnector = createMemoryMetaConnector({depth: 3});
  const synclet = await createSynclet({dataConnector, metaConnector});
  expect(dataConnector.getStore()).toEqual(store);
  expect(synclet.getDataConnector()!.getStore()).toEqual(store);

  await synclet.destroy();
});

test('getStore, synclet', async () => {
  const store = createStore();
  const synclet = await createTinyBaseSynclet({store});

  expect(synclet.getDataConnector()!.getStore()).toEqual(store);

  await synclet.destroy();
});

describe('reactive', async () => {
  let store1: Store;
  let store2: Store;

  let synclet1: Synclet<3>;
  let synclet2: Synclet<3>;
  const messages: string[] = [];

  beforeEach(async () => {
    messages.splice(0);
    reset();

    const poolId = getUniqueId();

    store1 = createStore();
    const dataConnector1 = createTinyBaseDataConnector({store: store1});
    const metaConnector1 = createMemoryMetaConnector({depth: 3});
    synclet1 = await createSynclet(
      {
        dataConnector: dataConnector1,
        metaConnector: metaConnector1,
        transport: createMemoryTransport({poolId}),
      },
      {
        onSendMessage: async (message) => {
          messages.push(JSON.stringify(['S', message[3], message[4]]) as any);
        },
        onReceiveMessage: async (message) => {
          messages.push(JSON.stringify(['R', message[3], message[4]]) as any);
        },
        getNow,
      },
      {id: 'synclet1'},
    );
    await synclet1.start();

    store2 = createStore();
    const dataConnector2 = createTinyBaseDataConnector({store: store2});
    const metaConnector2 = createMemoryMetaConnector({depth: 3});
    synclet2 = await createSynclet(
      {
        dataConnector: dataConnector2,
        metaConnector: metaConnector2,
        transport: createMemoryTransport({poolId}),
      },
      {getNow},
      {id: 'synclet2'},
    );
    await synclet2.start();
  });

  afterEach(async () => {
    await synclet1.destroy();
    await synclet2.destroy();
  });

  test('cell', async () => {
    store1.setCell('t1', 'r1', 'c1', 1);
    await pause(1);
    expect(store2.getTables()).toEqual({t1: {r1: {c1: 1}}});
    expect(messages).toMatchSnapshot();
  });

  test('value', async () => {
    store1.setValue('v1', 1);
    await pause(1);
    expect(store2.getValues()).toEqual({v1: 1});
    expect(messages).toMatchSnapshot();
  });

  test('both', async () => {
    store1.setCell('t1', 'r1', 'c1', 1);
    await pause(1);
    store1.setValue('v1', 1);
    await pause(1);
    expect(store2.getContent()).toEqual([{t1: {r1: {c1: 1}}}, {v1: 1}]);
    expect(messages).toMatchSnapshot();
  });

  test('both (transaction)', async () => {
    store1.startTransaction();
    store1.setCell('t1', 'r1', 'c1', 1);
    await pause(1);
    store1.setValue('v1', 1);
    store1.finishTransaction();
    expect(store2.getContent()).toEqual([{}, {}]);
    await pause(1);
    expect(store2.getContent()).toEqual([{t1: {r1: {c1: 1}}}, {v1: 1}]);
    expect(messages).toMatchSnapshot();
  });
});
