import {createSynclet} from 'synclets';
import {createMemoryMetaConnector} from 'synclets/connector/memory';
import {createTinyBaseDataConnector} from 'synclets/connector/tinybase';
import {createMemoryTransport} from 'synclets/transport/memory';
import {createStore, getUniqueId, type Store} from 'tinybase';
import {beforeEach, describe, expect, test} from 'vitest';
import {describeCommonConnectorTests, getTimeFunctions} from '../common.ts';

const [reset, getNow, pause] = getTimeFunctions();

describeCommonConnectorTests(
  async () => {},
  async () => {},
  () => createTinyBaseDataConnector(createStore()),
  (depth: number) => createMemoryMetaConnector(depth),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
  0,
  [3],
);

test('getStore, tables', async () => {
  const store = createStore();
  const dataConnector = createTinyBaseDataConnector(store);
  const synclet = await createSynclet({dataConnector});
  expect(dataConnector.getStore()).toBe(store);
  expect(synclet.getDataConnector().getStore()).toBe(store);
});

describe('reactive', async () => {
  let store1: Store;
  let store2: Store;
  const messages: string[] = [];

  beforeEach(async () => {
    messages.splice(0);
    reset();

    const poolId = getUniqueId();

    store1 = createStore();
    const dataConnector1 = createTinyBaseDataConnector(store1);
    const synclet1 = await createSynclet(
      {
        dataConnector: dataConnector1,
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
    const dataConnector2 = createTinyBaseDataConnector(store2);
    const synclet2 = await createSynclet(
      {
        dataConnector: dataConnector2,
        transport: createMemoryTransport({poolId}),
      },
      {getNow},
      {id: 'synclet2'},
    );
    await synclet2.start();
  });

  test('cell', async () => {
    store1.setCell('t1', 'r1', 'c1', 1);
    await pause(1);
    expect(store2.getTables()).toBe({t1: {r1: {c1: 1}}});
    expect(messages).toMatchSnapshot();
  });

  test('value', async () => {
    store1.setValue('v1', 1);
    await pause(1);
    expect(store2.getValues()).toBe({v1: 1});
    expect(messages).toMatchSnapshot();
  });

  test('both', async () => {
    store1.setCell('t1', 'r1', 'c1', 1);
    await pause(1);
    store1.setValue('v1', 1);
    await pause(1);
    expect(store2.getContent()).toBe([{t1: {r1: {c1: 1}}}, {v1: 1}]);
    expect(messages).toMatchSnapshot();
  });

  test('both (transaction)', async () => {
    store1.startTransaction();
    store1.setCell('t1', 'r1', 'c1', 1);
    await pause(1);
    store1.setValue('v1', 1);
    store1.finishTransaction();
    expect(store2.getContent()).toBe([{}, {}]);
    await pause(1);
    expect(store2.getContent()).toBe([{t1: {r1: {c1: 1}}}, {v1: 1}]);
    expect(messages).toMatchSnapshot();
  });
});
