import {Synclet} from 'synclets';
import {BaseConnector} from 'synclets/connector';
import {ValueConnector} from 'synclets/connector/value';
import {BaseTransport} from 'synclets/transport';
import {MemoryTransport} from 'synclets/transport/memory';

test('constructor', () => {
  const synclet = new Synclet(BaseConnector, BaseTransport);
  expect(synclet).toBeInstanceOf(Synclet);
});

test('accessors 1', () => {
  const synclet = new Synclet(BaseConnector, BaseTransport);
  expect(synclet.getConnector()).toBeInstanceOf(BaseConnector);
  expect(synclet.getTransport()).toBeInstanceOf(BaseTransport);
});

test('accessors 2', () => {
  const synclet = new Synclet(ValueConnector, MemoryTransport);
  expect(synclet.getConnector()).toBeInstanceOf(ValueConnector);
  expect(synclet.getTransport()).toBeInstanceOf(MemoryTransport);
});

test('start & stop', async () => {
  const synclet = new Synclet(BaseConnector, BaseTransport);
  expect(synclet.getStarted()).toBe(false);
  expect(synclet.getConnector().getConnected()).toEqual(false);
  expect(synclet.getTransport().getConnected()).toEqual(false);

  await synclet.start();
  expect(synclet.getStarted()).toEqual(true);
  expect(synclet.getConnector().getConnected()).toEqual(true);
  expect(synclet.getTransport().getConnected()).toEqual(true);

  await synclet.stop();
  expect(synclet.getStarted()).toEqual(false);
  expect(synclet.getConnector().getConnected()).toEqual(false);
  expect(synclet.getTransport().getConnected()).toEqual(false);
});
