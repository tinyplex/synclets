import {
  Connector,
  createConnector,
  createSynclet,
  createTransport,
  Transport,
} from 'synclets';

let connector: Connector;
let transport: Transport;

beforeEach(() => {
  connector = createConnector();
  transport = createTransport();
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
    createSynclet(connector, createTransport());
  }).toThrow('Connector is already attached to Synclet synclet1');
});

test('error on reassigning transport', () => {
  createSynclet(connector, transport, {}, {id: 'synclet1'});
  expect(() => {
    createSynclet(createConnector(), transport);
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
