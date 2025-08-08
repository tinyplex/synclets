import {ConnectorOptions, createSynclet, Timestamp, Value} from 'synclets';
import {createValueConnector} from 'synclets/connector/value';
import {createMemoryTransport} from 'synclets/transport/memory';

const createTestValueConnector = (options?: ConnectorOptions) => {
  let underlyingValue: Value = 'V1';
  let underlyingTimestamp: Timestamp = '';
  let underlyingValueSync: (() => Promise<void>) | undefined;

  const connect = async (valueSync: () => Promise<void>) => {
    underlyingValueSync = valueSync;
  };

  const getValue = async () => {
    return underlyingValue;
  };

  const getValueTimestamp = async () => {
    return underlyingTimestamp;
  };

  const setValue = async (value: Value) => {
    underlyingValue = value;
  };

  const setValueTimestamp = async (timestamp: Timestamp) => {
    underlyingTimestamp = timestamp;
  };

  const getUnderlyingValue = () => underlyingValue;

  const setUnderlyingValue = async (value: Value) => {
    underlyingValue = value;
    underlyingTimestamp = new Date().toISOString();
    await underlyingValueSync?.();
  };

  const connector = createValueConnector(
    {
      connect,
      getValue,
      getValueTimestamp,
      setValue,
      setValueTimestamp,
    },
    options,
  );
  return {
    ...connector,
    getUnderlyingValue,
    setUnderlyingValue,
  };
};

test('value sync', async () => {
  const connector1 = createTestValueConnector();
  const connector2 = createTestValueConnector();
  const connector3 = createTestValueConnector();

  const synclet1 = createSynclet(connector1, createMemoryTransport(), {
    id: '1',
  });
  await synclet1.start();

  const synclet2 = createSynclet(connector2, createMemoryTransport(), {
    id: '2',
  });
  await synclet2.start();

  expect(connector1.getUnderlyingValue()).toEqual(
    connector2.getUnderlyingValue(),
  );

  await connector1.setUnderlyingValue('V2');
  expect(connector2.getUnderlyingValue()).toEqual('V2');

  const synclet3 = createSynclet(connector3, createMemoryTransport(), {
    id: '3',
  });
  await synclet3.start();

  expect(connector3.getUnderlyingValue()).toEqual('V2');
});
