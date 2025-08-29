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
  createConnector({
    get: async () => 0,
    getTimestamp: async () => '',
    getHash: async () => 0,
    set: async () => {},
    setTimestamp: async () => {},
    setHash: async () => {},
    hasChildren: async () => false,
    getChildren: async () => [],
  });

const createMockTransport = () =>
  createTransport({
    sendPacket: async () => {},
  });

beforeEach(() => {
  connector = createMockConnector();
  transport = createMockTransport();
});

test('createSynclet', () => {
  const synclet = createSynclet(connector, transport);
  expect(synclet).toBeDefined();
});

test('log', () => {
  const logger = {info: jest.fn()};
  const synclet = createSynclet(
    connector,
    transport,
    {},
    {id: 'synclet', logger},
  );
  expect(logger.info).toHaveBeenCalledWith('[synclet] createSynclet');
  synclet.start();
  expect(logger.info).toHaveBeenCalledWith('[synclet] start');
  synclet.stop();
  expect(logger.info).toHaveBeenCalledWith('[synclet] stop');
});

test('error on reassigning connector', () => {
  createSynclet(connector, transport, {}, {id: 'synclet1'});
  expect(() => {
    createSynclet(connector, createMockTransport());
  }).toThrow('Connector is already attached to Synclet synclet1');
});

test('error on reassigning transport', () => {
  createSynclet(connector, transport, {}, {id: 'synclet1'});
  expect(() => {
    createSynclet(createMockConnector(), transport);
  }).toThrow('Transport is already attached to Synclet synclet1');
});

test('start & stop', async () => {
  const synclet1 = createSynclet(connector, transport);
  expect(synclet1.getStarted()).toEqual(false);

  await synclet1.start();
  expect(synclet1.getStarted()).toEqual(true);

  await synclet1.stop();
  expect(synclet1.getStarted()).toEqual(false);
});

describe('context', () => {
  test('send message', async () => {
    const getSendContext = jest.fn();
    const canReceiveMessage = jest.fn();

    const synclet1 = createSynclet(
      createMockConnector(),
      createMemoryTransport({poolId: 'pool1'}),
      {
        getSendContext,
      },
    );
    const synclet2 = createSynclet(
      createMockConnector(),
      createMemoryTransport({poolId: 'pool1'}),
      {
        canReceiveMessage,
      },
    );
    await synclet2.start();
    await synclet1.start();

    expect(getSendContext).toHaveBeenCalledWith(0, [], '', {});
    expect(canReceiveMessage).toHaveBeenCalledWith(0, [], '', {});
  });

  test('add context', async () => {
    const getSendContext = jest.fn();
    const canReceiveMessage = jest.fn();

    const synclet1 = createSynclet(
      createMockConnector(),
      createMemoryTransport({poolId: 'pool1'}),
      {
        getSendContext,
      },
    );
    const synclet2 = createSynclet(
      createMockConnector(),
      createMemoryTransport({poolId: 'pool1'}),
      {
        canReceiveMessage,
      },
    );
    await synclet2.start();
    await synclet1.start();

    expect(getSendContext).toHaveBeenCalledWith(0, [], '', {});
    expect(canReceiveMessage).toHaveBeenCalledWith(0, [], '', {});
  });
});
