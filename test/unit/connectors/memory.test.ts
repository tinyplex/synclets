import {Atoms, ConnectorOptions} from 'synclets';
import {
  createMemoryConnector,
  type MemoryConnector,
} from 'synclets/connector/memory';
import {
  expectDifferingConnectors,
  expectEquivalentConnectors,
  getChainedTestConnectors,
  getPooledTestSyncletsAndConnectors,
  pause,
} from '../common.ts';

interface TestMemoryConnector extends MemoryConnector {
  setAtomForTest(value: string): Promise<void>;
  setNearAtomForTest(value: string): Promise<void>;
  setFarAtomForTest(value: string): Promise<void>;
  delAtomForTest(): Promise<void>;
  getDataForTest(): Atoms;
  getMetaForTest(): string;
}

describe.each([[0, []]])(
  '%d-depth',
  (
    atomDepth: number,
    address: string[],
    nearAddress?: string[],
    farAddress?: string[],
  ) => {
    const createTestMemoryConnector = async (
      options?: ConnectorOptions,
    ): Promise<TestMemoryConnector> => {
      const connector = await createMemoryConnector(atomDepth, {}, options);

      return {
        ...connector,

        setAtomForTest: async (value: string) =>
          connector.setAtom(address, value),
        setNearAtomForTest: async (value: string) => {
          if (nearAddress) {
            connector.setAtom(nearAddress, value);
          }
        },
        setFarAtomForTest: async (value: string) => {
          if (farAddress) {
            connector.setAtom(farAddress, value);
          }
        },

        delAtomForTest: async () => connector.delAtom(address),

        getDataForTest: connector.getAtoms,

        getMetaForTest: connector.getJson,
      };
    };

    describe('2-way', () => {
      test('connected, initial', async () => {
        const [[, connector1], [, connector2]] =
          await getPooledTestSyncletsAndConnectors(
            createTestMemoryConnector,
            2,
          );

        expectEquivalentConnectors([connector1, connector2]);
      });

      test('connected', async () => {
        const [[, connector1], [, connector2]] =
          await getPooledTestSyncletsAndConnectors(
            createTestMemoryConnector,
            2,
          );

        await connector1.setAtomForTest('A');
        expectEquivalentConnectors([connector1, connector2]);

        await connector2.setAtomForTest('B');
        expectEquivalentConnectors([connector1, connector2]);
      });

      test('connected, deletion', async () => {
        const [[, connector1], [, connector2]] =
          await getPooledTestSyncletsAndConnectors(
            createTestMemoryConnector,
            2,
          );

        await connector1.setAtomForTest('A');
        expectEquivalentConnectors([connector1, connector2]);

        const timestamp = connector1.getMetaForTest();
        await connector1.delAtomForTest();
        expectEquivalentConnectors([connector1, connector2]);
        expect(timestamp).not.toEqual(connector1.getMetaForTest());
      });

      test('start 1, set 1, start 2', async () => {
        const [[synclet1, connector1], [synclet2, connector2]] =
          await getPooledTestSyncletsAndConnectors(
            createTestMemoryConnector,
            2,
            false,
          );

        await synclet1.start();

        await connector1.setAtomForTest('A');
        expectDifferingConnectors(connector1, connector2);

        await synclet2.start();
        expectEquivalentConnectors([connector1, connector2]);
      });

      test('start 2, set 1, start 1', async () => {
        const [[synclet1, connector1], [synclet2, connector2]] =
          await getPooledTestSyncletsAndConnectors(
            createTestMemoryConnector,
            2,
            false,
          );

        await synclet2.start();
        await connector1.connect();
        await connector1.setAtomForTest('A');
        expectDifferingConnectors(connector1, connector2);

        await synclet1.start();
        expectEquivalentConnectors([connector1, connector2]);
      });

      test('stop 1, set 1, start 1', async () => {
        const [[synclet1, connector1], [synclet2, connector2]] =
          await getPooledTestSyncletsAndConnectors(
            createTestMemoryConnector,
            2,
            false,
          );

        await synclet1.start();
        await synclet2.start();

        await connector1.setAtomForTest('A');
        expectEquivalentConnectors([connector1, connector2]);

        await synclet1.stop();
        await connector1.connect();
        await connector1.setAtomForTest('B');
        expectDifferingConnectors(connector1, connector2);

        await synclet1.start();
        expectEquivalentConnectors([connector1, connector2]);
      });

      test('stop 1, set 2, start 1', async () => {
        const [[synclet1, connector1], [synclet2, connector2]] =
          await getPooledTestSyncletsAndConnectors(
            createTestMemoryConnector,
            2,
            false,
          );

        await synclet1.start();
        await synclet2.start();

        await connector1.setAtomForTest('A');
        expectEquivalentConnectors([connector1, connector2]);

        await synclet1.stop();
        await connector2.setAtomForTest('B');
        expectDifferingConnectors(connector1, connector2);

        await synclet1.start();
        expectEquivalentConnectors([connector1, connector2]);
      });

      test('set 1, set 2, start 2, start 1', async () => {
        const [[synclet1, connector1], [synclet2, connector2]] =
          await getPooledTestSyncletsAndConnectors(
            createTestMemoryConnector,
            2,
            false,
          );

        await connector1.connect();
        await connector1.setAtomForTest('A');
        expectDifferingConnectors(connector1, connector2);

        await pause();

        await connector2.connect();
        await connector2.setAtomForTest('B');
        expectDifferingConnectors(connector1, connector2);

        await synclet2.start();
        await synclet1.start();
        expectEquivalentConnectors([connector1, connector2]);
      });

      test('connected, near atom', async () => {
        if (nearAddress) {
          const [[, connector1], [, connector2]] =
            await getPooledTestSyncletsAndConnectors(
              createTestMemoryConnector,
              2,
            );
          await connector1.setAtomForTest('A');
          await connector2.setNearAtomForTest('B');
          expectEquivalentConnectors([connector1, connector2], {
            t1: {r1: {c1: 'A', c2: 'B'}},
          });
        }
      });

      test('connected, far atom', async () => {
        if (farAddress) {
          const [[, connector1], [, connector2]] =
            await getPooledTestSyncletsAndConnectors(
              createTestMemoryConnector,
              2,
            );
          await connector1.setAtomForTest('A');
          await connector2.setFarAtomForTest('B');
          expectEquivalentConnectors([connector1, connector2], {
            t1: {r1: {c1: 'A'}},
            t2: {r2: {c2: 'B'}},
          });
        }
      });

      test('disconnected, near atom', async () => {
        if (nearAddress) {
          const [[synclet1, connector1], [synclet2, connector2]] =
            await getPooledTestSyncletsAndConnectors(
              createTestMemoryConnector,
              2,
              false,
            );
          await connector1.connect();
          await connector2.connect();
          await connector1.setAtomForTest('A');
          await connector2.setNearAtomForTest('B');
          await synclet1.start();
          await synclet2.start();
          expectEquivalentConnectors([connector1, connector2], {
            t1: {r1: {c1: 'A', c2: 'B'}},
          });
        }
      });

      test('disconnected, far atom', async () => {
        if (farAddress) {
          const [[synclet1, connector1], [synclet2, connector2]] =
            await getPooledTestSyncletsAndConnectors(
              createTestMemoryConnector,
              2,
              false,
            );
          await connector1.connect();
          await connector2.connect();
          await connector1.setAtomForTest('A');
          await connector2.setFarAtomForTest('B');
          await synclet1.start();
          await synclet2.start();
          expectEquivalentConnectors([connector1, connector2], {
            t1: {r1: {c1: 'A'}},
            t2: {r2: {c2: 'B'}},
          });
        }
      });

      test('disconnected, conflicting values', async () => {
        const [[synclet1, connector1], [synclet2, connector2]] =
          await getPooledTestSyncletsAndConnectors(
            createTestMemoryConnector,
            2,
            false,
          );
        await connector1.connect();
        await connector2.connect();
        await connector1.setAtomForTest('A');
        await pause();
        await connector1.setAtomForTest('B');
        await synclet1.start();
        await synclet2.start();
        expectEquivalentConnectors([connector1, connector2], {
          t1: {r1: {c1: 'B'}},
        });
      });

      test('disconnected, conflicting values 2', async () => {
        if (nearAddress && farAddress) {
          const [[synclet1, connector1], [synclet2, connector2]] =
            await getPooledTestSyncletsAndConnectors(
              createTestMemoryConnector,
              2,
              false,
            );
          await connector1.connect();
          await connector2.connect();
          await connector1.setAtomForTest('A');
          await connector1.setNearAtomForTest('B');
          await pause();
          await connector2.setNearAtomForTest('C');
          await connector2.setFarAtomForTest('D');
          await synclet1.start();
          await synclet2.start();
          expectEquivalentConnectors([connector1, connector2], {
            t1: {r1: {c1: 'A', c2: 'C'}},
            t2: {r2: {c2: 'D'}},
          });
        }
      });
    });

    describe.each([3, 10])('%d-way', (count: number) => {
      test('pool', async () => {
        const syncletsAndConnectors = await getPooledTestSyncletsAndConnectors(
          createTestMemoryConnector,
          count,
        );

        const connectors = syncletsAndConnectors.map(
          ([, connector]) => connector,
        );

        for (const [i, connector] of connectors.entries()) {
          await connector.setAtomForTest('A' + (i + 1));
          expectEquivalentConnectors(connectors);
        }
      });

      test('chain', async () => {
        const connectors = await getChainedTestConnectors(
          createTestMemoryConnector,
          count,
        );

        for (const [i, connector] of connectors.entries()) {
          await connector.setAtomForTest('V' + (i + 1));
          expectEquivalentConnectors(connectors);
        }
      });

      test('ring', async () => {
        const connectors = await getChainedTestConnectors(
          createTestMemoryConnector,
          count,
          true,
        );

        for (const [i, connector] of connectors.entries()) {
          await connector.setAtomForTest('V' + (i + 1));
          expectEquivalentConnectors(connectors);
        }
      });
    });
  },
);
