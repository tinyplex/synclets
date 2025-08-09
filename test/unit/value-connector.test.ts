import console from 'console';
import {
  ConnectorOptions,
  createSynclet,
  Synclet,
  Timestamp,
  Value,
} from 'synclets';
import {createValueConnector} from 'synclets/connector/value';
import {createMemoryTransport} from 'synclets/transport/memory';
import {getUniqueId} from 'synclets/utils';
import {pause} from './common.ts';

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
console;

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

const getSyncletsAndConnectors = (number: number, log = false) => {
  const poolId = getUniqueId();
  return new Array(number)
    .fill(0)
    .map((_, i) => getSyncletAndConnector(i + 1 + '', poolId, log));
};

const getSyncletAndConnector = (
  id?: string,
  poolId: string = getUniqueId(),
  log = false,
): [Synclet, ReturnType<typeof createTestValueConnector>] => {
  const logger = log ? console : undefined;
  const connector = createTestValueConnector();
  const synclet = createSynclet(
    connector,
    createMemoryTransport({poolId, logger}),
    {id, logger},
  );
  return [synclet, connector];
};

describe('value sync, two way', () => {
  test('connected, initial', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getSyncletsAndConnectors(2);

    await synclet1.start();
    await synclet2.start();

    expect(connector1.getUnderlyingValue()).toEqual(
      connector2.getUnderlyingValue(),
    );
  });

  test('connected, two way', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getSyncletsAndConnectors(2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingValue('V2');
    expect(connector1.getUnderlyingValue()).toEqual('V2');
    expect(connector2.getUnderlyingValue()).toEqual('V2');

    await pause();
    await connector2.setUnderlyingValue('V3');
    expect(connector2.getUnderlyingValue()).toEqual('V3');
    expect(connector1.getUnderlyingValue()).toEqual('V3');
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getSyncletsAndConnectors(2);

    await synclet1.start();

    await connector1.setUnderlyingValue('V2');
    expect(connector1.getUnderlyingValue()).toEqual('V2');
    expect(connector2.getUnderlyingValue()).toEqual('V1');

    await synclet2.start();
    expect(connector1.getUnderlyingValue()).toEqual('V2');
    expect(connector2.getUnderlyingValue()).toEqual('V2');
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getSyncletsAndConnectors(2);

    await synclet2.start();
    await connector1.setUnderlyingValue('V2');
    expect(connector1.getUnderlyingValue()).toEqual('V2');
    expect(connector2.getUnderlyingValue()).toEqual('V1');

    await synclet1.start();
    expect(connector1.getUnderlyingValue()).toEqual('V2');
    expect(connector2.getUnderlyingValue()).toEqual('V2');
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getSyncletsAndConnectors(2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingValue('V2');
    expect(connector1.getUnderlyingValue()).toEqual('V2');
    expect(connector2.getUnderlyingValue()).toEqual('V2');

    await synclet1.stop();
    await pause();
    await connector1.setUnderlyingValue('V3');
    expect(connector1.getUnderlyingValue()).toEqual('V3');
    expect(connector2.getUnderlyingValue()).toEqual('V2');

    await synclet1.start();
    expect(connector1.getUnderlyingValue()).toEqual('V3');
    expect(connector2.getUnderlyingValue()).toEqual('V3');
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getSyncletsAndConnectors(2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingValue('V2');
    expect(connector1.getUnderlyingValue()).toEqual('V2');
    expect(connector2.getUnderlyingValue()).toEqual('V2');

    await synclet1.stop();
    await pause();
    await connector2.setUnderlyingValue('V3');
    expect(connector1.getUnderlyingValue()).toEqual('V2');
    expect(connector2.getUnderlyingValue()).toEqual('V3');

    await synclet1.start();
    expect(connector1.getUnderlyingValue()).toEqual('V3');
    expect(connector2.getUnderlyingValue()).toEqual('V3');
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getSyncletsAndConnectors(2);

    await connector1.setUnderlyingValue('V2');
    expect(connector1.getUnderlyingValue()).toEqual('V2');
    expect(connector2.getUnderlyingValue()).toEqual('V1');

    await pause();

    await connector2.setUnderlyingValue('V3');
    expect(connector1.getUnderlyingValue()).toEqual('V2');
    expect(connector2.getUnderlyingValue()).toEqual('V3');

    await synclet2.start();
    await synclet1.start();
    expect(connector1.getUnderlyingValue()).toEqual('V3');
    expect(connector2.getUnderlyingValue()).toEqual('V3');
  });
});
