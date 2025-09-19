import {
  Connector,
  createConnector,
  createSynclet,
  createTransport,
  Transport,
} from 'synclets';
import {createMemoryTransport} from 'synclets/transport/memory';

let connector: Connector;
let transport: Transport;

const createMockConnector = () =>
  createConnector(0, {
    readAtom: async () => 0,
    readTimestamp: async () => '',
    readHash: async () => 0,
    writeAtom: async () => {},
    writeTimestamp: async () => {},
    writeHash: async () => {},
    removeAtom: async () => {},
    readChildIds: async () => [],
  });

const createMockTransport = () =>
  createTransport({
    sendPacket: async () => {},
  });

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

  const synclet2 = await createSynclet(connector, await createMockTransport());
  await synclet.start();
  await synclet2.start();
  expect(connector.isConnected()).toBe(true);
  await synclet.stop();
  expect(connector.isConnected()).toBe(true);
  await synclet2.stop();
  expect(connector.isConnected()).toBe(false);
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

    expect(canReceiveMessage).toHaveBeenCalledWith(0, [], {});
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

    expect(getSendContext).toHaveBeenCalledWith(0, [], {});
    expect(canReceiveMessage).toHaveBeenCalledWith(0, [], {foo: 42});
  });
});
