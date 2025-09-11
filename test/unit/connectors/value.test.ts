import {Atom, ConnectorOptions, Timestamp} from 'synclets';
import {
  BaseValueConnector,
  createBaseValueConnector,
} from 'synclets/connector/base';
import {getTestSyncletsAndConnectors} from '../common.ts';

type TestValueConnector = BaseValueConnector & {
  setValueForTest: (value: Atom) => Promise<void>;
  delValueForTest: () => Promise<void>;
  getValueForTest: () => Atom | undefined;
  getTimestampForTest: () => Timestamp | undefined;
};

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

    getValueForTest: () => value,

    getTimestampForTest: () => timestamp,
  };
};

const expectEquivalentConnectors = (
  connector1: TestValueConnector,
  connector2: TestValueConnector,
  value?: Atom | undefined,
) => {
  expect(connector1.getValueForTest()).toEqual(value);
  expect(connector2.getValueForTest()).toEqual(value);
  expect(connector1.getTimestampForTest()).toEqual(
    connector2.getTimestampForTest(),
  );
};

const expectDifferingConnectors = (
  connector1: TestValueConnector,
  connector2: TestValueConnector,
  value1: Atom | undefined,
  value2?: Atom | undefined,
) => {
  expect(connector1.getValueForTest()).toEqual(value1);
  expect(connector2.getValueForTest()).toEqual(value2);
  expect(connector1.getTimestampForTest()).not.toEqual(
    connector2.getTimestampForTest(),
  );
};

describe('value sync, basics', () => {
  test('connected, initial', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();
    await synclet2.start();

    expectEquivalentConnectors(connector1, connector2);
  });

  test('connected', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValueForTest('V1');
    expectEquivalentConnectors(connector1, connector2, 'V1');

    await connector2.setValueForTest('V2');
    expectEquivalentConnectors(connector1, connector2, 'V2');
  });

  test('connected, deletion', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValueForTest('V1');
    expectEquivalentConnectors(connector1, connector2, 'V1');

    const timestamp = connector1.getTimestampForTest();
    await connector1.delValueForTest();
    expectEquivalentConnectors(connector1, connector2);
    expect(timestamp).not.toEqual(connector1.getTimestampForTest());
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();

    await connector1.setValueForTest('V1');
    expectDifferingConnectors(connector1, connector2, 'V1');

    await synclet2.start();
    expectEquivalentConnectors(connector1, connector2, 'V1');
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet2.start();
    await connector1.setValueForTest('V1');
    expectDifferingConnectors(connector1, connector2, 'V1');

    await synclet1.start();
    expectEquivalentConnectors(connector1, connector2, 'V1');
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValueForTest('V1');
    expectEquivalentConnectors(connector1, connector2, 'V1');

    await synclet1.stop();
    await connector1.setValueForTest('V2');
    expectDifferingConnectors(connector1, connector2, 'V2', 'V1');

    await synclet1.start();
    expectEquivalentConnectors(connector1, connector2, 'V2');
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValueForTest('V1');
    expectEquivalentConnectors(connector1, connector2, 'V1');

    await synclet1.stop();
    await connector2.setValueForTest('V2');
    expectDifferingConnectors(connector1, connector2, 'V1', 'V2');

    await synclet1.start();
    expectEquivalentConnectors(connector1, connector2, 'V2');
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getTestSyncletsAndConnectors(createTestValueConnector, 2);

    await connector1.setValueForTest('V1');
    expectDifferingConnectors(connector1, connector2, 'V1');

    await connector2.setValueForTest('V2');
    expectDifferingConnectors(connector1, connector2, 'V1', 'V2');

    await synclet2.start();
    await synclet1.start();
    expectEquivalentConnectors(connector1, connector2, 'V2');
  });
});
