import console from 'console';
import {
  ConnectorOptions,
  createSynclet,
  Hash,
  Timestamp,
  Value,
} from 'synclets';
import {createValuesConnector} from 'synclets/connector/values';
import {createMemoryTransport} from 'synclets/transport/memory';

const createTestValuesConnector = (options?: ConnectorOptions) => {
  const underlyingValues: {[id: string]: Value} = {v1: 'V1'};
  const underlyingTimestamps: {[id: string]: Timestamp} = {v1: ''};
  let underlyingHash: Hash = 0;
  let underlyingValuesSync: (() => Promise<void>) | undefined;

  const connect = async (valuesSync: () => Promise<void>) => {
    underlyingValuesSync = valuesSync;
  };

  const getValuesHash = async () => underlyingHash;

  const getValueIds = async () => Object.keys(underlyingValues);

  const getValue = async (id: string) => {
    return underlyingValues[id];
  };

  const getValueTimestamp = async (id: string) => {
    return underlyingTimestamps[id];
  };

  const setValuesHash = async (hash: Hash) => {
    underlyingHash = hash;
  };

  const setValue = async (id: string, value: Value) => {
    underlyingValues[id] = value;
  };

  const setValueTimestamp = async (id: string, timestamp: Timestamp) => {
    underlyingTimestamps[id] = timestamp;
  };

  const getUnderlyingValues = () => underlyingValues;

  const setUnderlyingValue = async (id: string, value: Value) => {
    underlyingValues[id] = value;
    underlyingTimestamps[id] = new Date().toISOString();
    underlyingHash++;
    await underlyingValuesSync?.();
  };

  const connector = createValuesConnector(
    {
      connect,
      getValuesHash,
      getValueIds,
      getValue,
      getValueTimestamp,
      setValuesHash,
      setValue,
      setValueTimestamp,
    },
    options,
  );
  return {
    ...connector,
    getUnderlyingValues,
    setUnderlyingValue,
  };
};

test('values sync', async () => {
  const connector1 = createTestValuesConnector();
  const connector2 = createTestValuesConnector();
  const connector3 = createTestValuesConnector();

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

  expect(connector1.getUnderlyingValues()).toEqual(
    connector2.getUnderlyingValues(),
  );

  await connector1.setUnderlyingValue('v1', 'V2');
  expect(connector2.getUnderlyingValues()).toEqual({v1: 'V2'});

  const synclet3 = createSynclet(
    connector3,
    createMemoryTransport({logger: console}),
    {
      id: '3',
      logger: console,
    },
  );
  await synclet3.start();

  expect(connector3.getUnderlyingValues()).toEqual({v1: 'V2'});
});
