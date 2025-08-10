import {Address, ConnectorOptions, Hash, Timestamp, Value} from 'synclets';
import {createValuesConnector} from 'synclets/connector/values';
import {getHash} from 'synclets/utils';
import {getTestSyncletsAndConnectors} from './common.ts';

const createTestValuesConnector = (options?: ConnectorOptions) => {
  const underlyingValues: {[id: string]: Value} = {};
  const underlyingTimestamps: {[id: string]: Timestamp} = {};
  let underlyingHash: Hash = 0;
  let underlyingSync: ((id: string) => Promise<void>) | undefined;

  const connect = async (sync: (address: Address) => Promise<void>) => {
    underlyingSync = (id: string) => sync([id]);
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
    const timestamp = connector.getNextTimestamp();
    underlyingValues[id] = value;
    underlyingTimestamps[id] = timestamp;
    underlyingHash ^= getHash(timestamp) >>> 0;
    await underlyingSync?.(id);
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

describe('values sync, basics', () => {
  test('connected, initial', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    expect(connector1.getUnderlyingValues()).toEqual(
      connector2.getUnderlyingValues(),
    );
  });

  test('connected', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingValue('v1', 'V1');
    expect(connector1.getUnderlyingValues()).toEqual({v1: 'V1'});
    expect(connector2.getUnderlyingValues()).toEqual({v1: 'V1'});

    await connector2.setUnderlyingValue('v1', 'V2');
    expect(connector2.getUnderlyingValues()).toEqual({v1: 'V2'});
    expect(connector1.getUnderlyingValues()).toEqual({v1: 'V2'});
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();

    await connector1.setUnderlyingValue('v1', 'V1');
    expect(connector1.getUnderlyingValues()).toEqual({v1: 'V1'});
    expect(connector2.getUnderlyingValues()).toEqual({});

    await synclet2.start();
    expect(connector1.getUnderlyingValues()).toEqual({v1: 'V1'});
    expect(connector2.getUnderlyingValues()).toEqual({v1: 'V1'});
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet2.start();
    await connector1.setUnderlyingValue('v1', 'V1');
    expect(connector1.getUnderlyingValues()).toEqual({v1: 'V1'});
    expect(connector2.getUnderlyingValues()).toEqual({});

    await synclet1.start();
    expect(connector1.getUnderlyingValues()).toEqual({v1: 'V1'});
    expect(connector2.getUnderlyingValues()).toEqual({v1: 'V1'});
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingValue('v1', 'V1');
    expect(connector1.getUnderlyingValues()).toEqual({v1: 'V1'});
    expect(connector2.getUnderlyingValues()).toEqual({v1: 'V1'});

    await synclet1.stop();
    await connector1.setUnderlyingValue('v1', 'V2');
    expect(connector1.getUnderlyingValues()).toEqual({v1: 'V2'});
    expect(connector2.getUnderlyingValues()).toEqual({v1: 'V1'});

    await synclet1.start();
    expect(connector1.getUnderlyingValues()).toEqual({v1: 'V2'});
    expect(connector2.getUnderlyingValues()).toEqual({v1: 'V2'});
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingValue('v1', 'V1');
    expect(connector1.getUnderlyingValues()).toEqual({v1: 'V1'});
    expect(connector2.getUnderlyingValues()).toEqual({v1: 'V1'});

    await synclet1.stop();
    await connector2.setUnderlyingValue('v1', 'V2');
    expect(connector1.getUnderlyingValues()).toEqual({v1: 'V1'});
    expect(connector2.getUnderlyingValues()).toEqual({v1: 'V2'});

    await synclet1.start();
    expect(connector1.getUnderlyingValues()).toEqual({v1: 'V2'});
    expect(connector2.getUnderlyingValues()).toEqual({v1: 'V2'});
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await connector1.setUnderlyingValue('v1', 'V1');
    expect(connector1.getUnderlyingValues()).toEqual({v1: 'V1'});
    expect(connector2.getUnderlyingValues()).toEqual({});

    await connector2.setUnderlyingValue('v1', 'V2');
    expect(connector1.getUnderlyingValues()).toEqual({v1: 'V1'});
    expect(connector2.getUnderlyingValues()).toEqual({v1: 'V2'});

    await synclet2.start();
    await synclet1.start();
    expect(connector1.getUnderlyingValues()).toEqual({v1: 'V2'});
    expect(connector2.getUnderlyingValues()).toEqual({v1: 'V2'});
  });
});

describe('values sync, multiple values', () => {
  test('connected, different values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingValue('v1', 'V1');
    await connector2.setUnderlyingValue('v2', 'V2');
    expect(connector1.getUnderlyingValues()).toEqual({v1: 'V1', v2: 'V2'});
    expect(connector2.getUnderlyingValues()).toEqual({v1: 'V1', v2: 'V2'});
  });

  test('disconnected, different values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await connector1.setUnderlyingValue('v1', 'V1');
    await connector2.setUnderlyingValue('v2', 'V2');

    await synclet1.start();
    await synclet2.start();
    expect(connector1.getUnderlyingValues()).toEqual({v1: 'V1', v2: 'V2'});
    expect(connector2.getUnderlyingValues()).toEqual({v1: 'V1', v2: 'V2'});
  });

  test('disconnected, conflicting values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await connector1.setUnderlyingValue('v1', 'V1');
    await connector2.setUnderlyingValue('v2', 'V2');
    await connector1.setUnderlyingValue('v2', 'V3');
    await connector2.setUnderlyingValue('v3', 'V3');

    await synclet1.start();
    await synclet2.start();
    expect(connector1.getUnderlyingValues()).toEqual({
      v1: 'V1',
      v2: 'V3',
      v3: 'V3',
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      v1: 'V1',
      v2: 'V3',
      v3: 'V3',
    });
  });
});
