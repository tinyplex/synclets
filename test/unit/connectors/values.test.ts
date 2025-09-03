import {Atom, ConnectorOptions, Hash, Timestamp} from 'synclets';
import {createBaseValuesConnector} from 'synclets/connector/base';
import {getTestSyncletsAndConnectors} from '../common.ts';

const createTestValuesConnector = (options?: ConnectorOptions) => {
  const values: {[valueId: string]: Atom} = {};
  const timestamps: {[valueId: string]: Timestamp} = {};
  let valuesHash: Hash = 0;

  const connector = createBaseValuesConnector(
    {
      getValuesHash: async () => valuesHash,

      getValueIds: async () => Object.keys(values),

      getValueAtom: async (valueId: string) => values[valueId],

      getValueTimestamp: async (valueId: string) => timestamps[valueId],

      setValuesHash: async (hash: Hash) => {
        valuesHash = hash;
      },

      setValueAtom: async (valueId: string, atom: Atom) => {
        values[valueId] = atom;
      },

      setValueTimestamp: async (valueId: string, timestamp: Timestamp) => {
        timestamps[valueId] = timestamp;
      },
    },
    options,
  );

  const getValues = () => values;

  return {
    ...connector,
    getValues,
  };
};

describe('values sync, basics', () => {
  test('connected, initial', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    expect(connector1.getValues()).toEqual(connector2.getValues());
  });

  test('connected', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValue('v1', 'V1');
    expect(connector1.getValues()).toEqual({v1: 'V1'});
    expect(connector2.getValues()).toEqual({v1: 'V1'});

    await connector2.setValue('v1', 'V2');
    expect(connector2.getValues()).toEqual({v1: 'V2'});
    expect(connector1.getValues()).toEqual({v1: 'V2'});
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();

    await connector1.setValue('v1', 'V1');
    expect(connector1.getValues()).toEqual({v1: 'V1'});
    expect(connector2.getValues()).toEqual({});

    await synclet2.start();
    expect(connector1.getValues()).toEqual({v1: 'V1'});
    expect(connector2.getValues()).toEqual({v1: 'V1'});
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet2.start();
    await connector1.setValue('v1', 'V1');
    expect(connector1.getValues()).toEqual({v1: 'V1'});
    expect(connector2.getValues()).toEqual({});

    await synclet1.start();
    expect(connector1.getValues()).toEqual({v1: 'V1'});
    expect(connector2.getValues()).toEqual({v1: 'V1'});
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValue('v1', 'V1');
    expect(connector1.getValues()).toEqual({v1: 'V1'});
    expect(connector2.getValues()).toEqual({v1: 'V1'});

    await synclet1.stop();
    await connector1.setValue('v1', 'V2');
    expect(connector1.getValues()).toEqual({v1: 'V2'});
    expect(connector2.getValues()).toEqual({v1: 'V1'});

    await synclet1.start();
    expect(connector1.getValues()).toEqual({v1: 'V2'});
    expect(connector2.getValues()).toEqual({v1: 'V2'});
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValue('v1', 'V1');
    expect(connector1.getValues()).toEqual({v1: 'V1'});
    expect(connector2.getValues()).toEqual({v1: 'V1'});

    await synclet1.stop();
    await connector2.setValue('v1', 'V2');
    expect(connector1.getValues()).toEqual({v1: 'V1'});
    expect(connector2.getValues()).toEqual({v1: 'V2'});

    await synclet1.start();
    expect(connector1.getValues()).toEqual({v1: 'V2'});
    expect(connector2.getValues()).toEqual({v1: 'V2'});
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await connector1.setValue('v1', 'V1');
    expect(connector1.getValues()).toEqual({v1: 'V1'});
    expect(connector2.getValues()).toEqual({});

    await connector2.setValue('v1', 'V2');
    expect(connector1.getValues()).toEqual({v1: 'V1'});
    expect(connector2.getValues()).toEqual({v1: 'V2'});

    await synclet2.start();
    await synclet1.start();
    expect(connector1.getValues()).toEqual({v1: 'V2'});
    expect(connector2.getValues()).toEqual({v1: 'V2'});
  });
});

describe('values sync, multiple values', () => {
  test('connected, different values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValue('v1', 'V1');
    await connector2.setValue('v2', 'V2');
    expect(connector1.getValues()).toEqual({v1: 'V1', v2: 'V2'});
    expect(connector2.getValues()).toEqual({v1: 'V1', v2: 'V2'});
  });

  test('disconnected, different values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await connector1.setValue('v1', 'V1');
    await connector2.setValue('v2', 'V2');

    await synclet1.start();
    await synclet2.start();
    expect(connector1.getValues()).toEqual({v1: 'V1', v2: 'V2'});
    expect(connector2.getValues()).toEqual({v1: 'V1', v2: 'V2'});
  });

  test('disconnected, conflicting values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await connector1.setValue('v1', 'V1');
    await connector2.setValue('v2', 'V2');
    await connector1.setValue('v2', 'V3');
    await connector2.setValue('v3', 'V3');

    await synclet1.start();
    await synclet2.start();
    expect(connector1.getValues()).toEqual({
      v1: 'V1',
      v2: 'V3',
      v3: 'V3',
    });
    expect(connector2.getValues()).toEqual({
      v1: 'V1',
      v2: 'V3',
      v3: 'V3',
    });
  });
});
