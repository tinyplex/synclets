import {Connector, createSynclet, Transport} from 'synclets';
import {createMemoryTransport} from 'synclets/transport/memory';
import {createMockConnector, createMockTransport} from './common.ts';

let connector: Connector;
let transport: Transport;

beforeEach(async () => {
  connector = await createMockConnector();
  transport = await createMockTransport();
});

test('createSynclet', () => {
  const synclet = createSynclet(connector, transport);
  expect(synclet).toBeDefined();
});

test('log', async () => {
  const logger = {info: jest.fn()};
  const synclet = await createSynclet(
    connector,
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
  await createSynclet(connector, transport, {});
  await expect(async () => {
    await createSynclet(await createMockConnector(), transport);
  }).rejects.toThrow('Transport is already attached to Synclet');
});

test('error on reassigning connector', async () => {
  await createSynclet(connector, transport, {});
  await expect(async () => {
    await createSynclet(connector, await createMockConnector());
  }).rejects.toThrow('Connector is already attached to Synclet');
});

test('start & stop', async () => {
  const synclet = await createSynclet(connector, transport);
  expect(synclet.isStarted()).toBe(false);
  expect(connector.isConnected()).toBe(false);
  expect(transport.isConnected()).toBe(false);

  await synclet.start();
  expect(synclet.isStarted()).toBe(true);
  expect(connector.isConnected()).toBe(true);
  expect(transport.isConnected()).toBe(true);

  await synclet.stop();
  expect(synclet.isStarted()).toBe(false);
  expect(connector.isConnected()).toBe(false);
  expect(transport.isConnected()).toBe(false);

  const transports = [await createMockTransport(), await createMockTransport()];
  const synclet2 = await createSynclet(await createMockConnector(), transports);
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
      await createMockConnector(),
      await createMemoryTransport({poolId: 'pool1'}),
    );
    const synclet2 = await createSynclet(
      await createMockConnector(),
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
      await createMockConnector(),
      await createMemoryTransport({poolId: 'pool1'}),
      {getSendContext},
    );
    const synclet2 = await createSynclet(
      await createMockConnector(),
      await createMemoryTransport({poolId: 'pool1'}),
      {canReceiveMessage},
    );
    await synclet2.start();
    await synclet1.start();

    expect(getSendContext).toHaveBeenCalledWith({});
    expect(canReceiveMessage).toHaveBeenCalledWith({foo: 42});
  });
});
