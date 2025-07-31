import {Connector, Synclet, Transport} from 'synclets';

let connector: Connector;
let transport: Transport;

beforeEach(() => {
  connector = new Connector();
  transport = new Transport();
});

test('constructor', () => {
  const synclet = new Synclet(new Connector(), new Transport());
  expect(synclet).toBeInstanceOf(Synclet);
});

test('error on reassigning connector', () => {
  new Synclet(connector, transport);
  expect(() => {
    new Synclet(connector, new Transport());
  }).toThrow('Connector is already attached to a Synclet');
});

test('error on reassigning transport', () => {
  new Synclet(connector, transport);
  expect(() => {
    new Synclet(new Connector(), transport);
  }).toThrow('Transport is already attached to a Synclet');
});

test('accessors', () => {
  const synclet = new Synclet(connector, transport);
  expect(synclet.getConnector()).toBe(connector);
  expect(synclet.getTransport()).toBe(transport);
});

test('start & stop', async () => {
  const synclet1 = new Synclet(connector, transport);
  expect(synclet1.getStarted()).toEqual(false);
  expect(synclet1.getConnector().getConnected()).toEqual(false);
  expect(synclet1.getTransport().getConnected()).toEqual(false);

  await synclet1.start();
  expect(synclet1.getStarted()).toEqual(true);
  expect(synclet1.getConnector().getConnected()).toEqual(true);
  expect(synclet1.getTransport().getConnected()).toEqual(true);

  await synclet1.stop();
  expect(synclet1.getStarted()).toEqual(false);
  expect(synclet1.getConnector().getConnected()).toEqual(false);
  expect(synclet1.getTransport().getConnected()).toEqual(false);
});
