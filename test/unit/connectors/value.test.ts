import {Atom, ConnectorOptions, Timestamp} from 'synclets';
import {createBaseValueConnector} from 'synclets/connector/base';
import {getTestSyncletsAndConnectors} from '../common.ts';

const createTestValueConnector = (options?: ConnectorOptions) => {
  let value: Atom = '';
  let timestamp: Timestamp = '';

  return createBaseValueConnector(
    {
      getValueAtom: async () => value,

      getValueTimestamp: async () => timestamp,

      setValueAtom: async (atom: Atom) => {
        value = atom;
      },

      setValueTimestamp: async (newTimestamp: Timestamp) => {
        timestamp = newTimestamp;
      },
    },
    options,
  );
};

describe('value sync, basics', () => {
  test('connected, initial', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();
    await synclet2.start();

    expect(await connector1.getValue()).toEqual(await connector2.getValue());
  });

  test('connected', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValue('V1');
    expect(await connector1.getValue()).toEqual('V1');
    expect(await connector2.getValue()).toEqual('V1');

    await connector2.setValue('V2');
    expect(await connector2.getValue()).toEqual('V2');
    expect(await connector1.getValue()).toEqual('V2');
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();

    await connector1.setValue('V1');
    expect(await connector1.getValue()).toEqual('V1');
    expect(await connector2.getValue()).toEqual('');

    await synclet2.start();
    expect(await connector1.getValue()).toEqual('V1');
    expect(await connector2.getValue()).toEqual('V1');
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet2.start();
    await connector1.setValue('V1');
    expect(await connector1.getValue()).toEqual('V1');
    expect(await connector2.getValue()).toEqual('');

    await synclet1.start();
    expect(await connector1.getValue()).toEqual('V1');
    expect(await connector2.getValue()).toEqual('V1');
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValue('V1');
    expect(await connector1.getValue()).toEqual('V1');
    expect(await connector2.getValue()).toEqual('V1');

    await synclet1.stop();
    await connector1.setValue('V2');
    expect(await connector1.getValue()).toEqual('V2');
    expect(await connector2.getValue()).toEqual('V1');

    await synclet1.start();
    expect(await connector1.getValue()).toEqual('V2');
    expect(await connector2.getValue()).toEqual('V2');
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValue('V1');
    expect(await connector1.getValue()).toEqual('V1');
    expect(await connector2.getValue()).toEqual('V1');

    await synclet1.stop();
    await connector2.setValue('V2');
    expect(await connector1.getValue()).toEqual('V1');
    expect(await connector2.getValue()).toEqual('V2');

    await synclet1.start();
    expect(await connector1.getValue()).toEqual('V2');
    expect(await connector2.getValue()).toEqual('V2');
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await connector1.setValue('V1');
    expect(await connector1.getValue()).toEqual('V1');
    expect(await connector2.getValue()).toEqual('');

    await connector2.setValue('V2');
    expect(await connector1.getValue()).toEqual('V1');
    expect(await connector2.getValue()).toEqual('V2');

    await synclet2.start();
    await synclet1.start();
    expect(await connector1.getValue()).toEqual('V2');
    expect(await connector2.getValue()).toEqual('V2');
  });
});
