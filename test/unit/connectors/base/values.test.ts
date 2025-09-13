import {Atom, ConnectorOptions, Hash, Timestamp} from 'synclets';
import {
  BaseValuesConnector,
  createBaseValuesConnector,
} from 'synclets/connector/base';
import {
  expectDifferingConnectors,
  expectEquivalentConnectors,
  getChainedTestConnectors,
  getPooledTestSyncletsAndConnectors,
  pause,
} from '../../common.ts';

interface TestValuesConnector extends BaseValuesConnector {
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

    getDataForTest: () => values,

    getMetaForTest: () => [timestamps, valuesHash],
  };
};

describe('2-way', () => {
  test('connected, initial', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestValuesConnector, 2);

    expectEquivalentConnectors([connector1, connector2], {});
  });

  test('connected', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await connector1.setValue('v1', 'V1');
    expectEquivalentConnectors([connector1, connector2], {v1: 'V1'});

    await connector2.setValue('v1', 'V2');
    expectEquivalentConnectors([connector1, connector2], {v1: 'V2'});
  });

  test('connected, deletion', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await connector1.setValue('v1', 'V1');
    expectEquivalentConnectors([connector1, connector2], {v1: 'V1'});

    const timestamp = connector1.getMetaForTest()[0].v1;
    await connector1.delValue('v1');
    expectEquivalentConnectors([connector1, connector2], {});
    expect(timestamp).not.toEqual(connector1.getMetaForTest()[0].v1);
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestValuesConnector,
        2,
        false,
      );

    await synclet1.start();

    await connector1.setValue('v1', 'V1');
    expectDifferingConnectors(connector1, connector2, {v1: 'V1'}, {});

    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], {v1: 'V1'});
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestValuesConnector,
        2,
        false,
      );

    await synclet2.start();
    await connector1.connect();
    await connector1.setValue('v1', 'V1');
    expectDifferingConnectors(connector1, connector2, {v1: 'V1'}, {});

    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], {v1: 'V1'});
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestValuesConnector,
        2,
        false,
      );

    await synclet1.start();
    await synclet2.start();

    await connector1.setValue('v1', 'V1');
    expectEquivalentConnectors([connector1, connector2], {v1: 'V1'});

    await synclet1.stop();
    await connector1.connect();
    await connector1.setValue('v1', 'V2');
    expectDifferingConnectors(connector1, connector2, {v1: 'V2'}, {v1: 'V1'});

    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], {v1: 'V2'});
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestValuesConnector,
        2,
        false,
      );

    await synclet1.start();
    await synclet2.start();

    await connector1.setValue('v1', 'V1');
    expectEquivalentConnectors([connector1, connector2], {v1: 'V1'});

    await synclet1.stop();
    await connector2.setValue('v1', 'V2');
    expectDifferingConnectors(connector1, connector2, {v1: 'V1'}, {v1: 'V2'});

    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], {v1: 'V2'});
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestValuesConnector,
        2,
        false,
      );

    await connector1.connect();
    await connector1.setValue('v1', 'V1');
    expectDifferingConnectors(connector1, connector2, {v1: 'V1'}, {});

    await pause();

    await connector2.connect();
    await connector2.setValue('v1', 'V2');
    expectDifferingConnectors(connector1, connector2, {v1: 'V1'}, {v1: 'V2'});

    await synclet2.start();
    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], {v1: 'V2'});
  });

  test('connected, different values', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestValuesConnector, 2);

    await connector1.setValue('v1', 'V1');
    await connector2.setValue('v2', 'V2');
    expectEquivalentConnectors([connector1, connector2], {v1: 'V1', v2: 'V2'});
  });

  test('disconnected, different values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestValuesConnector,
        2,
        false,
      );

    await connector1.connect();
    await connector2.connect();
    await connector1.setValue('v1', 'V1');
    await connector2.setValue('v2', 'V2');

    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], {v1: 'V1', v2: 'V2'});
  });

  test('disconnected, conflicting values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestValuesConnector,
        2,
        false,
      );

    await connector1.connect();
    await connector2.connect();
    await connector1.setValue('v1', 'V1');
    await connector2.setValue('v2', 'V2');
    await pause();
    await connector1.setValue('v2', 'V3');
    await connector2.setValue('v3', 'V3');

    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], {
      v1: 'V1',
      v2: 'V3',
      v3: 'V3',
    });
  });
});

describe.each([3, 10])('%d-way', (count: number) => {
  test('pool', async () => {
    const syncletsAndConnectors = await getPooledTestSyncletsAndConnectors(
      createTestValuesConnector,
      count,
    );

    const connectors = syncletsAndConnectors.map(([, connector]) => connector);

    for (const [i, connector] of connectors.entries()) {
      await connector.setValue('v', 'V' + i);
      expectEquivalentConnectors(connectors, {v: 'V' + i});
    }
  });

  test('chain', async () => {
    const connectors = await getChainedTestConnectors(
      createTestValuesConnector,
      count,
    );

    for (const [i, connector] of connectors.entries()) {
      await connector.setValue('v', 'V' + i);
      expectEquivalentConnectors(connectors, {v: 'V' + i});
    }
  });

  test('ring', async () => {
    const connectors = await getChainedTestConnectors(
      createTestValuesConnector,
      count,
      true,
    );

    for (const [i, connector] of connectors.entries()) {
      await connector.setValue('v', 'V' + i);
      expectEquivalentConnectors(connectors, {v: 'V' + i});
    }
  });
});
