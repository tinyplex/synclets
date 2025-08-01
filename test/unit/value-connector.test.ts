import {createSynclet, Timestamp, Value} from 'synclets';
import {createValueConnector} from 'synclets/connector/value';
import {createMemoryTransport} from 'synclets/transport/memory';

const createTestValueConnector = () => {
  let underlyingValue: Value = 'V1';
  let underlyingTimestamp: Timestamp = '';

  const getValue = async () => {
    return underlyingValue;
  };
  const setValue = async (value: Value) => {
    underlyingValue = value;
  };
  const getValueTimestamp = async () => {
    return underlyingTimestamp;
  };
  const setValueTimestamp = async (timestamp: Timestamp) => {
    underlyingTimestamp = timestamp;
  };

  const getUnderlyingValue = () => underlyingValue;

  const setUnderlyingValue = async (value: Value) => {
    underlyingValue = value;
  };

  return {
    ...createValueConnector({
      getValue,
      setValue,
      getValueTimestamp,
      setValueTimestamp,
    }),
    getUnderlyingValue,
    setUnderlyingValue,
  };
};

test('value sync', async () => {
  const connector1 = createTestValueConnector();
  const connector2 = createTestValueConnector();

  const synclet1 = createSynclet(connector1, createMemoryTransport());
  await synclet1.start();

  const synclet2 = createSynclet(connector2, createMemoryTransport());
  await synclet2.start();

  expect(connector1.getUnderlyingValue()).toEqual(
    connector2.getUnderlyingValue(),
  );

  // await connector1.setUnderlyingValue('V2');
  // expect(connector2.getUnderlyingValue()).toEqual('V2');
});
