import {Atom, ConnectorOptions, Hash, Timestamp} from 'synclets';
import {
  BaseValuesConnector,
  createBaseValuesConnector,
} from 'synclets/connector/base';
import {
  expectDifferingConnectors,
  expectEquivalentConnectors,
  getTestSyncletsAndConnectors,
  pause,
} from '../../common.ts';

interface TestValuesConnector extends BaseValuesConnector {
  setValueForTest(valueId: string, value: Atom): Promise<void>;
  delValueForTest(valueId: string): Promise<void>;
  getDataForTest(): {[valueId: string]: Atom};
  getMetaForTest(): [{[valueId: string]: Timestamp}, Hash | undefined];
}

const createTestValuesConnector = async (
  options?: ConnectorOptions,
): Promise<TestValuesConnector> => {
  const values: {[valueId: string]: Atom} = {};
  const timestamps: {[valueId: string]: Timestamp} = {};
  let valuesHash: Hash | undefined;

  const connector = await createBaseValuesConnector(
    {
      readValuesHash: async () => valuesHash,

      readValueIds: async () => Object.keys(values),

      readValueAtom: async (valueId: string) => values[valueId],

      readValueTimestamp: async (valueId: string) => timestamps[valueId],

      writeValuesHash: async (hash: Hash) => {
        valuesHash = hash;
      },

      writeValueAtom: async (valueId: string, atom: Atom) => {
        values[valueId] = atom;
      },

      writeValueTimestamp: async (valueId: string, timestamp: Timestamp) => {
        timestamps[valueId] = timestamp;
      },

      removeValueAtom: async (valueId: string) => {
        delete values[valueId];
      },
    },
    options,
  );

  return {
    ...connector,

    setValueForTest: (valueId: string, value: Atom) =>
      connector.setValue(valueId, value),

    delValueForTest: (valueId: string) => connector.delValue(valueId),

    getDataForTest: () => values,

    getMetaForTest: () => [timestamps, valuesHash],
  };
};

describe('2-way', () => {
  test('connected, initial', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    expectEquivalentConnectors([connector1, connector2], {});
  });

  test('connected', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValueForTest('v1', 'V1');
    expectEquivalentConnectors([connector1, connector2], {v1: 'V1'});

    await connector2.setValueForTest('v1', 'V2');
    expectEquivalentConnectors([connector1, connector2], {v1: 'V2'});
  });

  test('connected, deletion', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValueForTest('v1', 'V1');
    expectEquivalentConnectors([connector1, connector2], {v1: 'V1'});

    const timestamp = connector1.getMetaForTest()[0].v1;
    await connector1.delValueForTest('v1');
    expectEquivalentConnectors([connector1, connector2], {});
    expect(timestamp).not.toEqual(connector1.getMetaForTest()[0].v1);
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();

    await connector1.setValueForTest('v1', 'V1');
    expectDifferingConnectors(connector1, connector2, {v1: 'V1'}, {});

    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], {v1: 'V1'});
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet2.start();
    await connector1.connect();
    await connector1.setValueForTest('v1', 'V1');
    expectDifferingConnectors(connector1, connector2, {v1: 'V1'}, {});

    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], {v1: 'V1'});
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValueForTest('v1', 'V1');
    expectEquivalentConnectors([connector1, connector2], {v1: 'V1'});

    await synclet1.stop();
    await connector1.connect();
    await connector1.setValueForTest('v1', 'V2');
    expectDifferingConnectors(connector1, connector2, {v1: 'V2'}, {v1: 'V1'});

    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], {v1: 'V2'});
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValueForTest('v1', 'V1');
    expectEquivalentConnectors([connector1, connector2], {v1: 'V1'});

    await synclet1.stop();
    await connector2.setValueForTest('v1', 'V2');
    expectDifferingConnectors(connector1, connector2, {v1: 'V1'}, {v1: 'V2'});

    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], {v1: 'V2'});
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await connector1.connect();
    await connector1.setValueForTest('v1', 'V1');
    expectDifferingConnectors(connector1, connector2, {v1: 'V1'}, {});

    await pause();

    await connector2.connect();
    await connector2.setValueForTest('v1', 'V2');
    expectDifferingConnectors(connector1, connector2, {v1: 'V1'}, {v1: 'V2'});

    await synclet2.start();
    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], {v1: 'V2'});
  });

  test('connected, different values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValueForTest('v1', 'V1');
    await connector2.setValueForTest('v2', 'V2');
    expectEquivalentConnectors([connector1, connector2], {v1: 'V1', v2: 'V2'});
  });

  test('disconnected, different values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await connector1.connect();
    await connector2.connect();
    await connector1.setValueForTest('v1', 'V1');
    await connector2.setValueForTest('v2', 'V2');

    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], {v1: 'V1', v2: 'V2'});
  });

  test('disconnected, conflicting values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await connector1.connect();
    await connector2.connect();
    await connector1.setValueForTest('v1', 'V1');
    await connector2.setValueForTest('v2', 'V2');
    await pause();
    await connector1.setValueForTest('v2', 'V3');
    await connector2.setValueForTest('v3', 'V3');

    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], {
      v1: 'V1',
      v2: 'V3',
      v3: 'V3',
    });
  });
});
