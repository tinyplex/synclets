import {Atoms, ConnectorOptions} from 'synclets';
import {
  createMemoryConnector,
  type MemoryConnector,
} from 'synclets/connector/memory';
import {
  expectEquivalentConnectors,
  getChainedTestConnectors,
  getPooledTestSyncletsAndConnectors,
} from '../../common.ts';

interface TestMemoryConnector extends MemoryConnector {
  setValueForTest(value: string): Promise<void>;
  delValueForTest(): Promise<void>;
  getDataForTest(): Atoms;
  getMetaForTest(): string;
}

const createTestMemoryConnector = async (
  options?: ConnectorOptions,
): Promise<TestMemoryConnector> => {
  const connector = await createMemoryConnector(0, {}, options);

  return {
    ...connector,

    setValueForTest: async (value: string) => connector.setAtom([], value),

    delValueForTest: async () => connector.delAtom([]),

    getDataForTest: connector.getAtoms,

    getMetaForTest: connector.getJson,
  };
};

describe('2-way', () => {
  test('connected, initial', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestMemoryConnector, 2);

    expectEquivalentConnectors([connector1, connector2], undefined);
  });

  test('connected', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestMemoryConnector, 2);

    await connector1.setValueForTest('V1');
    expectEquivalentConnectors([connector1, connector2], 'V1');

    await connector2.setValueForTest('V2');
    expectEquivalentConnectors([connector1, connector2], 'V2');
  });

  test('connected, deletion', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestMemoryConnector, 2);

    await connector1.setValueForTest('V1');
    expectEquivalentConnectors([connector1, connector2], 'V1');

    const timestamp = connector1.getMetaForTest();
    await connector1.delValueForTest();
    expectEquivalentConnectors([connector1, connector2], undefined);
    expect(timestamp).not.toEqual(connector1.getMetaForTest());
  });
});

describe.each([3, 10])('%d-way', (count: number) => {
  test('pool', async () => {
    const syncletsAndConnectors = await getPooledTestSyncletsAndConnectors(
      createTestMemoryConnector,
      count,
    );

    const connectors = syncletsAndConnectors.map(([, connector]) => connector);

    for (const [i, connector] of connectors.entries()) {
      await connector.setValueForTest('V' + i);
      expectEquivalentConnectors(connectors, 'V' + i);
    }
  });

  test('chain', async () => {
    const connectors = await getChainedTestConnectors(
      createTestMemoryConnector,
      count,
    );

    for (const [i, connector] of connectors.entries()) {
      await connector.setValueForTest('V' + i);
      expectEquivalentConnectors(connectors, 'V' + i);
    }
  });

  test('ring', async () => {
    const connectors = await getChainedTestConnectors(
      createTestMemoryConnector,
      count,
      true,
    );

    for (const [i, connector] of connectors.entries()) {
      await connector.setValueForTest('V' + i);
      expectEquivalentConnectors(connectors, 'V' + i);
    }
  });
});
