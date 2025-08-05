import console from 'console';
import {
  ConnectorOptions,
  createSynclet,
  Hash,
  Timestamp,
  Value,
} from 'synclets';
import {createValueConnector} from 'synclets/connector/value';
import {createMemoryTransport} from 'synclets/transport/memory';
import {getHash} from 'synclets/utils';

const createTestValueConnector = (options: ConnectorOptions) => {
  let underlyingValue: Value = 'V1';
  let underlyingHash: Hash = 0;
  let underlyingTimestamp: Timestamp = '';
  let underlyingValueSync: (() => Promise<void>) | undefined;

  const connect = async (valueSync: () => Promise<void>) => {
    underlyingValueSync = valueSync;
  };

  const getValue = async () => {
    return underlyingValue;
  };

  const getValueHash = async () => {
    return underlyingHash;
  };

  const getValueTimestamp = async () => {
    return underlyingTimestamp;
  };

  const setValue = async (value: Value) => {
    underlyingValue = value;
  };

  const setValueHash = async (hash: number) => {
    underlyingHash = hash;
  };

  const setValueTimestamp = async (timestamp: Timestamp) => {
    underlyingTimestamp = timestamp;
  };

  const getUnderlyingValue = () => underlyingValue;

  const setUnderlyingValue = async (value: Value) => {
    underlyingValue = value;
    underlyingTimestamp = new Date().toISOString();
    underlyingHash = getHash(
      JSON.stringify([underlyingValue, underlyingTimestamp]),
    );
    await underlyingValueSync?.();
  };

  const connector = createValueConnector(
    {
      connect,
      getValue,
      getValueHash,
      getValueTimestamp,
      setValue,
      setValueHash,
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
  const connector1 = createTestValueConnector({logger: console});
  const connector2 = createTestValueConnector({logger: console});
  const connector3 = createTestValueConnector({logger: console});

  const synclet1 = createSynclet(
    connector1,
    createMemoryTransport({logger: console}),
    {
      id: '1',
      logger: console,
    },
  );
  await synclet1.start();

  const synclet2 = createSynclet(
    connector2,
    createMemoryTransport({logger: console}),
    {
      id: '2',
      logger: console,
    },
  );
  await synclet2.start();

  expect(connector1.getUnderlyingValue()).toEqual(
    connector2.getUnderlyingValue(),
  );

  await connector1.setUnderlyingValue('V2');
  expect(connector2.getUnderlyingValue()).toEqual('V2');

  const synclet3 = createSynclet(
    connector3,
    createMemoryTransport({logger: console}),
    {
      id: '3',
      logger: console,
    },
  );
  await synclet3.start();

  expect(connector3.getUnderlyingValue()).toEqual('V2');
});
