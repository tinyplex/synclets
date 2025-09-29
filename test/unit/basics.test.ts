import {createSynclet, DataConnector, MetaConnector, Transport} from 'synclets';
import {createMemoryTransport} from 'synclets/transport/memory';
import {
  createMockDataConnector,
  createMockMetaConnector,
  createMockTransport,
} from './common.ts';

let dataConnector: DataConnector;
let metaConnector: MetaConnector;
let transport: Transport;

beforeEach(async () => {
  dataConnector = await createMockDataConnector();
  metaConnector = await createMockMetaConnector();
  transport = await createMockTransport();
});

test('createSynclet', () => {
  const synclet = createSynclet(dataConnector, metaConnector, transport);
  expect(synclet).toBeDefined();
});

test('log', async () => {
  const logger = {info: jest.fn()};
  const synclet = await createSynclet(
    dataConnector,
    metaConnector,
    transport,
    {},
    {id: 'synclet', logger},
  );
  await synclet.start();
  expect(logger.info).toHaveBeenCalledWith('[synclet] start');
  expect(logger.info).toHaveBeenCalledWith('[synclet] sync ');
  await synclet.stop();
  expect(logger.info).toHaveBeenCalledWith('[synclet] stop');
});

test('error on reassigning transport', async () => {
  await createSynclet(dataConnector, metaConnector, transport, {});
  await expect(async () => {
    await createSynclet(
      await createMockDataConnector(),
      await createMockMetaConnector(),
      transport,
    );
  }).rejects.toThrow('Transport is already attached to Synclet');
});

test('error on reassigning data connector', async () => {
  await createSynclet(dataConnector, metaConnector, transport, {});
  await expect(async () => {
    await createSynclet(
      dataConnector,
      await createMockMetaConnector(),
      await createMockTransport(),
    );
  }).rejects.toThrow('Data connector is already attached to Synclet');
});

test('error on reassigning meta connector', async () => {
  await createSynclet(dataConnector, metaConnector, transport, {});
  await expect(async () => {
    await createSynclet(
      await createMockDataConnector(),
      metaConnector,
      await createMockTransport(),
    );
  }).rejects.toThrow('Meta connector is already attached to Synclet');
});

test('start & stop', async () => {
  const synclet = await createSynclet(dataConnector, metaConnector, transport);
  expect(synclet.isStarted()).toBe(false);
  expect(transport.isConnected()).toBe(false);

  await synclet.start();
  expect(synclet.isStarted()).toBe(true);
  expect(transport.isConnected()).toBe(true);

  await synclet.stop();
  expect(synclet.isStarted()).toBe(false);
  expect(transport.isConnected()).toBe(false);

  const transports = [await createMockTransport(), await createMockTransport()];
  const synclet2 = await createSynclet(
    await createMockDataConnector(),
    await createMockMetaConnector(),
    transports,
  );
  await synclet2.start();
  expect(transports[0].isConnected()).toBe(true);
  expect(transports[1].isConnected()).toBe(true);

  await synclet2.stop();
  expect(transports[0].isConnected()).toBe(false);
  expect(transports[1].isConnected()).toBe(false);
});

describe('context', () => {
  test('send message', async () => {
    const canReceiveMessage = jest.fn();

    const synclet1 = await createSynclet(
      await createMockDataConnector(),
      await createMockMetaConnector(),
      await createMemoryTransport({poolId: 'pool1'}),
    );
    const synclet2 = await createSynclet(
      await createMockDataConnector(),
      await createMockMetaConnector(),
      await createMemoryTransport({poolId: 'pool1'}),
      {canReceiveMessage},
    );
    await synclet2.start();
    await synclet1.start();

    expect(canReceiveMessage).toHaveBeenCalledWith({});
  });

  test('add context', async () => {
    const getSendContext = jest.fn(async () => ({foo: 42}));
    const canReceiveMessage = jest.fn();

    const synclet1 = await createSynclet(
      await createMockDataConnector(),
      await createMockMetaConnector(),
      await createMemoryTransport({poolId: 'pool1'}),
      {getSendContext},
    );
    const synclet2 = await createSynclet(
      await createMockDataConnector(),
      await createMockMetaConnector(),
      await createMemoryTransport({poolId: 'pool1'}),
      {canReceiveMessage},
    );
    await synclet2.start();
    await synclet1.start();

    expect(getSendContext).toHaveBeenCalledWith({});
    expect(canReceiveMessage).toHaveBeenCalledWith({foo: 42});
  });
});
