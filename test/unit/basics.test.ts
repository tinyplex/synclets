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
    readAtom: async () => 0,
    readTimestamp: async () => '',
    readHash: async () => 0,
    writeAtom: async () => {},
    writeTimestamp: async () => {},
    writeHash: async () => {},
    removeAtom: async () => {},
    isParent: async () => false,
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
  expect(logger.info).toHaveBeenCalledWith('[S:synclet] start');
  expect(logger.info).toHaveBeenCalledWith('[S:synclet] sync ');
  await synclet.stop();
  expect(logger.info).toHaveBeenCalledWith('[S:synclet] stop');
});

test('error on reassigning connector', async () => {
  await createSynclet(connector, transport, {}, {id: 'synclet1'});
  await expect(async () => {
    await createSynclet(connector, await createMockTransport());
  }).rejects.toThrow('Connector is already attached to Synclet synclet1');
});

test('error on reassigning transport', async () => {
  await createSynclet(connector, transport, {}, {id: 'synclet1'});
  await expect(async () => {
    await createSynclet(await createMockConnector(), transport);
  }).rejects.toThrow('Transport is already attached to Synclet synclet1');
});

test('start & stop', async () => {
  const synclet1 = await createSynclet(connector, transport);
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

    const synclet1 = await createSynclet(
      await createMockConnector(),
      await createMemoryTransport({poolId: 'pool1'}),
      {
        getSendContext,
      },
    );
    const synclet2 = await createSynclet(
      await createMockConnector(),
      await createMemoryTransport({poolId: 'pool1'}),
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

    const synclet1 = await createSynclet(
      await createMockConnector(),
      await createMemoryTransport({poolId: 'pool1'}),
      {
        getSendContext,
      },
    );
    const synclet2 = await createSynclet(
      await createMockConnector(),
      await createMemoryTransport({poolId: 'pool1'}),
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
