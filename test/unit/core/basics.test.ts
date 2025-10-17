import {
  createSynclet,
  type DataConnector,
  type MetaConnector,
  type Transport,
} from 'synclets';
import {createMemoryTransport} from 'synclets/transport/memory';
import {beforeEach, describe, expect, test, vi} from 'vitest';
import {
  createMockDataConnector,
  createMockMetaConnector,
  createMockTransport,
} from '../common.ts';

let dataConnector: DataConnector<1>;
let metaConnector: MetaConnector<1>;
let transport: Transport;

beforeEach(async () => {
  dataConnector = createMockDataConnector(1);
  metaConnector = createMockMetaConnector(1);
  transport = createMockTransport();
});

test('createSynclet', () => {
  const synclet = createSynclet({dataConnector, metaConnector, transport});
  expect(synclet).toBeDefined();
});

test('log', async () => {
  const logger = {info: vi.fn()};
  const synclet = await createSynclet(
    {dataConnector, metaConnector, transport},
    {},
    {id: 'synclet', logger},
  );
  await synclet.start();
  expect(logger.info).toHaveBeenCalledWith('[synclet] start');
  expect(logger.info).toHaveBeenCalledWith('[synclet] sync (0) ');
  await synclet.stop();
  expect(logger.info).toHaveBeenCalledWith('[synclet] stop');
});

test('error on reassigning transport', async () => {
  await createSynclet({dataConnector, metaConnector, transport});
  await expect(async () => {
    await createSynclet({
      dataConnector: createMockDataConnector(1),
      metaConnector: createMockMetaConnector(1),
      transport,
    });
  }).rejects.toThrow('Transport is already attached to Synclet');
});

test('error on reassigning data connector', async () => {
  await createSynclet({dataConnector, metaConnector, transport});
  await expect(async () => {
    await createSynclet({
      dataConnector,
      metaConnector: createMockMetaConnector(1),
      transport: createMockTransport(),
    });
  }).rejects.toThrow('Data connector is already attached to Synclet');
});

test('error on reassigning meta connector', async () => {
  await createSynclet({dataConnector, metaConnector, transport});
  await expect(async () => {
    await createSynclet({
      dataConnector: createMockDataConnector(1),
      metaConnector,
      transport: createMockTransport(),
    });
  }).rejects.toThrow('Meta connector is already attached to Synclet');
});

test('start & stop', async () => {
  const synclet = await createSynclet({
    dataConnector,
    metaConnector,
    transport,
  });
  expect(synclet.isStarted()).toBe(false);

  await synclet.start();
  expect(synclet.isStarted()).toBe(true);

  await synclet.stop();
  expect(synclet.isStarted()).toBe(false);
});

describe('context', () => {
  test('send message', async () => {
    const canReceiveMessage = vi.fn();

    const synclet1 = await createSynclet({
      dataConnector: createMockDataConnector(1),
      metaConnector: createMockMetaConnector(1),
      transport: createMemoryTransport({poolId: 'pool1'}),
    });
    const synclet2 = await createSynclet(
      {
        dataConnector: createMockDataConnector(1),
        metaConnector: createMockMetaConnector(1),
        transport: createMemoryTransport({poolId: 'pool1'}),
      },
      {canReceiveMessage},
    );
    await synclet2.start();
    await synclet1.start();

    expect(canReceiveMessage).toHaveBeenCalledWith({});
  });

  test('add context', async () => {
    const getSendContext = vi.fn(async () => ({foo: 42}));
    const canReceiveMessage = vi.fn();

    const synclet1 = await createSynclet(
      {
        dataConnector: createMockDataConnector(1),
        metaConnector: createMockMetaConnector(1),
        transport: createMemoryTransport({poolId: 'pool1'}),
      },
      {getSendContext},
    );
    const synclet2 = await createSynclet(
      {
        dataConnector: createMockDataConnector(1),
        metaConnector: createMockMetaConnector(1),
        transport: createMemoryTransport({poolId: 'pool1'}),
      },
      {canReceiveMessage},
    );
    await synclet2.start();
    await synclet1.start();

    expect(getSendContext).toHaveBeenCalledWith({});
    expect(canReceiveMessage).toHaveBeenCalledWith({foo: 42});
  });
});
