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

test('error on reassigning connector', () => {
  createSynclet(connector, transport);
  expect(() => {
    createSynclet(connector, createTransport());
  }).toThrow('Connector is already attached to a Synclet');
});

test('error on reassigning transport', () => {
  createSynclet(connector, transport);
  expect(() => {
    createSynclet(createConnector(), transport);
  }).toThrow('Transport is already attached to a Synclet');
});

test('start & stop', async () => {
  const synclet1 = createSynclet(connector, transport);
  expect(synclet1.getStarted()).toEqual(false);

  await synclet1.start();
  expect(synclet1.getStarted()).toEqual(true);

  await synclet1.stop();
  expect(synclet1.getStarted()).toEqual(false);
});
