import {Atom, ConnectorOptions, Timestamp} from 'synclets';
import {
  BaseValueConnector,
  createBaseValueConnector,
} from 'synclets/connector/base';
import {
  expectDifferingConnectors,
  expectEquivalentConnectors,
  getTestSyncletsAndConnectors,
  pause,
} from '../../common.ts';

interface TestValueConnector extends BaseValueConnector {
  setValueForTest(value: Atom): Promise<void>;
  delValueForTest(): Promise<void>;
  getDataForTest(): Atom | undefined;
  getMetaForTest(): Timestamp | undefined;
}

const createTestValueConnector = async (
  options?: ConnectorOptions,
): Promise<TestValueConnector> => {
  let value: Atom | undefined;
  let timestamp: Timestamp | undefined;

  const connector = await createBaseValueConnector(
    {
      readValueAtom: async () => value,

      readValueTimestamp: async () => timestamp,

      writeValueAtom: async (atom: Atom) => {
        value = atom;
      },

      writeValueTimestamp: async (newTimestamp: Timestamp) => {
        timestamp = newTimestamp;
      },

      removeValueAtom: async () => {
        value = undefined;
      },
    },
    options,
  );

  return {
    ...connector,

    setValueForTest: (value: Atom) => connector.setValue(value),

    delValueForTest: () => connector.delValue(),

    getDataForTest: () => value,

    getMetaForTest: () => timestamp,
  };
};

describe('2-way', () => {
  test('connected, initial', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();
    await synclet2.start();

    expectEquivalentConnectors([connector1, connector2], undefined);
  });

  test('connected', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValueForTest('V1');
    expectEquivalentConnectors([connector1, connector2], 'V1');

    await connector2.setValueForTest('V2');
    expectEquivalentConnectors([connector1, connector2], 'V2');
  });

  test('connected, deletion', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValueForTest('V1');
    expectEquivalentConnectors([connector1, connector2], 'V1');

    const timestamp = connector1.getMetaForTest();
    await connector1.delValueForTest();
    expectEquivalentConnectors([connector1, connector2], undefined);
    expect(timestamp).not.toEqual(connector1.getMetaForTest());
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();

    await connector1.setValueForTest('V1');
    expectDifferingConnectors(connector1, connector2, 'V1', undefined);

    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], 'V1');
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet2.start();
    await connector1.connect();
    await connector1.setValueForTest('V1');
    expectDifferingConnectors(connector1, connector2, 'V1', undefined);

    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], 'V1');
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValueForTest('V1');
    expectEquivalentConnectors([connector1, connector2], 'V1');

    await synclet1.stop();
    await connector1.connect();
    await connector1.setValueForTest('V2');
    expectDifferingConnectors(connector1, connector2, 'V2', 'V1');

    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], 'V2');
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValueForTest('V1');
    expectEquivalentConnectors([connector1, connector2], 'V1');

    await synclet1.stop();
    await connector2.setValueForTest('V2');
    expectDifferingConnectors(connector1, connector2, 'V1', 'V2');

    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], 'V2');
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await connector1.connect();
    await connector1.setValueForTest('V1');
    expectDifferingConnectors(connector1, connector2, 'V1', undefined);

    await pause();

    await connector2.connect();
    await connector2.setValueForTest('V2');
    expectDifferingConnectors(connector1, connector2, 'V1', 'V2');

    await synclet2.start();
    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], 'V2');
  });
});

describe('3-way', () => {
  test('pool', async () => {
    const [
      [synclet1, connector1],
      [synclet2, connector2],
      [synclet3, connector3],
    ] = await getTestSyncletsAndConnectors(createTestValueConnector, 3);

    await synclet1.start();
    await synclet2.start();
    await synclet3.start();

    await connector1.setValueForTest('V1');
    expectEquivalentConnectors([connector1, connector2, connector3], 'V1');

    await connector2.setValueForTest('V2');
    expectEquivalentConnectors([connector1, connector2, connector3], 'V2');

    await connector3.setValueForTest('V3');
    expectEquivalentConnectors([connector1, connector2, connector3], 'V3');
  });
});
