import {ConnectorOptions, Timestamp, Value} from 'synclets';
import {createBaseValueConnector} from 'synclets/connector/base';
import {getTestSyncletsAndConnectors} from '../common.ts';

const createTestValueConnector = (options?: ConnectorOptions) => {
  let underlyingValue: Value = '';
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
    underlyingTimestamp = connector.getNextTimestamp();
    await underlyingValueSync?.();
  };

  const connector = createBaseValueConnector(
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

describe('value sync, basics', () => {
  test('connected, initial', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();
    await synclet2.start();

    expect(connector1.getUnderlyingValue()).toEqual(
      connector2.getUnderlyingValue(),
    );
  });

  test('connected', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingValue('V1');
    expect(connector1.getUnderlyingValue()).toEqual('V1');
    expect(connector2.getUnderlyingValue()).toEqual('V1');

    await connector2.setUnderlyingValue('V2');
    expect(connector2.getUnderlyingValue()).toEqual('V2');
    expect(connector1.getUnderlyingValue()).toEqual('V2');
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();

    await connector1.setUnderlyingValue('V1');
    expect(connector1.getUnderlyingValue()).toEqual('V1');
    expect(connector2.getUnderlyingValue()).toEqual('');

    await synclet2.start();
    expect(connector1.getUnderlyingValue()).toEqual('V1');
    expect(connector2.getUnderlyingValue()).toEqual('V1');
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet2.start();
    await connector1.setUnderlyingValue('V1');
    expect(connector1.getUnderlyingValue()).toEqual('V1');
    expect(connector2.getUnderlyingValue()).toEqual('');

    await synclet1.start();
    expect(connector1.getUnderlyingValue()).toEqual('V1');
    expect(connector2.getUnderlyingValue()).toEqual('V1');
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingValue('V1');
    expect(connector1.getUnderlyingValue()).toEqual('V1');
    expect(connector2.getUnderlyingValue()).toEqual('V1');

    await synclet1.stop();
    await connector1.setUnderlyingValue('V2');
    expect(connector1.getUnderlyingValue()).toEqual('V2');
    expect(connector2.getUnderlyingValue()).toEqual('V1');

    await synclet1.start();
    expect(connector1.getUnderlyingValue()).toEqual('V2');
    expect(connector2.getUnderlyingValue()).toEqual('V2');
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingValue('V1');
    expect(connector1.getUnderlyingValue()).toEqual('V1');
    expect(connector2.getUnderlyingValue()).toEqual('V1');

    await synclet1.stop();
    await connector2.setUnderlyingValue('V2');
    expect(connector1.getUnderlyingValue()).toEqual('V1');
    expect(connector2.getUnderlyingValue()).toEqual('V2');

    await synclet1.start();
    expect(connector1.getUnderlyingValue()).toEqual('V2');
    expect(connector2.getUnderlyingValue()).toEqual('V2');
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await connector1.setUnderlyingValue('V1');
    expect(connector1.getUnderlyingValue()).toEqual('V1');
    expect(connector2.getUnderlyingValue()).toEqual('');

    await connector2.setUnderlyingValue('V2');
    expect(connector1.getUnderlyingValue()).toEqual('V1');
    expect(connector2.getUnderlyingValue()).toEqual('V2');

    await synclet2.start();
    await synclet1.start();
    expect(connector1.getUnderlyingValue()).toEqual('V2');
    expect(connector2.getUnderlyingValue()).toEqual('V2');
  });
});
