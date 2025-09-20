import {mkdtemp, readFile, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {Atoms, ConnectorOptions} from 'synclets';
import {createFileConnector, type FileConnector} from 'synclets/connector/fs';
import {getUniqueId, jsonParse, jsonString} from 'synclets/utils';
import {
  expectDifferingConnectors,
  expectEquivalentConnectors,
  getChainedTestConnectors,
  getPooledTestSyncletsAndConnectors,
  pause,
} from '../common.ts';

interface TestFileConnector extends FileConnector {
  setAtomForTest(value: string): Promise<void>;
  setNearAtomForTest(value: string): Promise<void>;
  setFarAtomForTest(value: string): Promise<void>;
  delAtomForTest(): Promise<void>;
  getDataForTest(): Atoms;
  getMetaForTest(): string;
  getUnderlyingMetaForTest(): Promise<string>;
}

let tmp: string;

beforeAll(async () => {
  tmp = await mkdtemp(tmpdir() + sep);
});

afterAll(async () => await rm(tmp, {recursive: true, force: true}));

test('file', async () => {
  const file = join(tmp, '42');
  const connector = await createFileConnector(0, file);
  expect(connector.getFile()).toBe(file);
});

describe.each([
  [0, []],
  [1, ['a'], ['b']],
  [2, ['a', 'aa'], ['a', 'ab'], ['b', 'ba']],
  [3, ['a', 'aa', 'aaa'], ['a', 'aa', 'aab'], ['b', 'ba', 'baa']],
  [
    4,
    ['a', 'aa', 'aaa', 'aaaa'],
    ['a', 'aa', 'aaa', 'aaab'],
    ['b', 'ba', 'baa', 'baaa'],
  ],
])(
  '%d-depth',
  (
    atomDepth: number,
    address: string[],
    nearAddress?: string[],
    farAddress?: string[],
  ) => {
    const createTestFileConnector = async (
      options?: ConnectorOptions,
    ): Promise<TestFileConnector> => {
      const connector = await createFileConnector(
        atomDepth,
        join(tmp, getUniqueId()),
        options,
      );

      return {
        ...connector,

        setAtomForTest: async (value: string) =>
          await connector.setAtom(address, value),

        setNearAtomForTest: async (value: string) => {
          if (nearAddress) {
            await connector.setAtom(nearAddress, value);
          }
        },

        setFarAtomForTest: async (value: string) => {
          if (farAddress) {
            await connector.setAtom(farAddress, value);
          }
        },

        delAtomForTest: async () => connector.delAtom(address),

        getDataForTest: connector.getAtoms,

        getMetaForTest: () => jsonParse(connector.getJson()),

        getUnderlyingMetaForTest: async () => {
          const json = await readFile(connector.getFile(), 'utf8');
          return jsonParse(
            json == ''
              ? atomDepth > 0
                ? jsonString([0, {}])
                : jsonString(['', undefined])
              : json,
          );
        },
      };
    };

    describe('2-way', () => {
      test('connected, initial', async () => {
        const [[, connector1], [, connector2]] =
          await getPooledTestSyncletsAndConnectors(createTestFileConnector, 2);

        await expectEquivalentConnectors([connector1, connector2]);
      });

      test('connected', async () => {
        const [[, connector1], [, connector2]] =
          await getPooledTestSyncletsAndConnectors(createTestFileConnector, 2);

        await connector1.setAtomForTest('A');
        await expectEquivalentConnectors([connector1, connector2]);

        await connector2.setAtomForTest('B');
        await expectEquivalentConnectors([connector1, connector2]);
      });

      test('connected, deletion', async () => {
        const [[, connector1], [, connector2]] =
          await getPooledTestSyncletsAndConnectors(createTestFileConnector, 2);

        await connector1.setAtomForTest('A');
        await expectEquivalentConnectors([connector1, connector2]);

        const timestamp = connector1.getMetaForTest();
        await connector1.delAtomForTest();
        await expectEquivalentConnectors([connector1, connector2]);
        expect(timestamp).not.toEqual(connector1.getMetaForTest());
      });

      test('start 1, set 1, start 2', async () => {
        const [[synclet1, connector1], [synclet2, connector2]] =
          await getPooledTestSyncletsAndConnectors(
            createTestFileConnector,
            2,
            false,
          );

        await synclet1.start();

        await connector1.setAtomForTest('A');
        await expectDifferingConnectors(connector1, connector2);

        await synclet2.start();
        await expectEquivalentConnectors([connector1, connector2]);
      });

      test('start 2, set 1, start 1', async () => {
        const [[synclet1, connector1], [synclet2, connector2]] =
          await getPooledTestSyncletsAndConnectors(
            createTestFileConnector,
            2,
            false,
          );

        await synclet2.start();
        await connector1.connect();
        await connector1.setAtomForTest('A');
        await expectDifferingConnectors(connector1, connector2);

        await synclet1.start();
        await expectEquivalentConnectors([connector1, connector2]);
      });

      test('stop 1, set 1, start 1', async () => {
        const [[synclet1, connector1], [synclet2, connector2]] =
          await getPooledTestSyncletsAndConnectors(
            createTestFileConnector,
            2,
            false,
          );

        await synclet1.start();
        await synclet2.start();

        await connector1.setAtomForTest('A');
        await expectEquivalentConnectors([connector1, connector2]);

        await synclet1.stop();
        await connector1.connect();
        await connector1.setAtomForTest('B');
        await expectDifferingConnectors(connector1, connector2);

        await synclet1.start();
        await expectEquivalentConnectors([connector1, connector2]);
      });

      test('stop 1, set 2, start 1', async () => {
        const [[synclet1, connector1], [synclet2, connector2]] =
          await getPooledTestSyncletsAndConnectors(
            createTestFileConnector,
            2,
            false,
          );

        await synclet1.start();
        await synclet2.start();

        await connector1.setAtomForTest('A');
        await expectEquivalentConnectors([connector1, connector2]);

        await synclet1.stop();
        await connector2.setAtomForTest('B');
        await expectDifferingConnectors(connector1, connector2);

        await synclet1.start();
        await expectEquivalentConnectors([connector1, connector2]);
      });

      test('set 1, set 2, start 2, start 1', async () => {
        const [[synclet1, connector1], [synclet2, connector2]] =
          await getPooledTestSyncletsAndConnectors(
            createTestFileConnector,
            2,
            false,
          );

        await connector1.connect();
        await connector1.setAtomForTest('A');
        await expectDifferingConnectors(connector1, connector2);

        await pause();

        await connector2.connect();
        await connector2.setAtomForTest('B');
        await expectDifferingConnectors(connector1, connector2);

        await synclet2.start();
        await synclet1.start();
        await expectEquivalentConnectors([connector1, connector2]);
      });

      test('connected, near atom', async () => {
        if (nearAddress) {
          const [[, connector1], [, connector2]] =
            await getPooledTestSyncletsAndConnectors(
              createTestFileConnector,
              2,
            );

          await connector1.setAtomForTest('A');
          await connector2.setNearAtomForTest('B');

          await expectEquivalentConnectors([connector1, connector2]);
        }
      });

      test('connected, far atom', async () => {
        if (farAddress) {
          const [[, connector1], [, connector2]] =
            await getPooledTestSyncletsAndConnectors(
              createTestFileConnector,
              2,
            );
          await connector1.setAtomForTest('A');
          await connector2.setFarAtomForTest('B');
          await expectEquivalentConnectors([connector1, connector2]);
        }
      });

      test('disconnected, near atom', async () => {
        if (nearAddress) {
          const [[synclet1, connector1], [synclet2, connector2]] =
            await getPooledTestSyncletsAndConnectors(
              createTestFileConnector,
              2,
              false,
            );
          await connector1.connect();
          await connector2.connect();
          await connector1.setAtomForTest('A');
          await connector2.setNearAtomForTest('B');
          await synclet1.start();
          await synclet2.start();
          await expectEquivalentConnectors([connector1, connector2]);
        }
      });

      test('disconnected, far atom', async () => {
        if (farAddress) {
          const [[synclet1, connector1], [synclet2, connector2]] =
            await getPooledTestSyncletsAndConnectors(
              createTestFileConnector,
              2,
              false,
            );
          await connector1.connect();
          await connector2.connect();
          await connector1.setAtomForTest('A');
          await connector2.setFarAtomForTest('B');
          await synclet1.start();
          await synclet2.start();
          await expectEquivalentConnectors([connector1, connector2]);
        }
      });

      test('disconnected, conflicting values', async () => {
        const [[synclet1, connector1], [synclet2, connector2]] =
          await getPooledTestSyncletsAndConnectors(
            createTestFileConnector,
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
        await expectEquivalentConnectors([connector1, connector2]);
      });

      test('disconnected, conflicting values 2', async () => {
        if (nearAddress && farAddress) {
          const [[synclet1, connector1], [synclet2, connector2]] =
            await getPooledTestSyncletsAndConnectors(
              createTestFileConnector,
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
          await expectEquivalentConnectors([connector1, connector2]);
        }
      });
    });

    describe.each([3, 10])('%d-way', (count: number) => {
      test('pool', async () => {
        const syncletsAndConnectors = await getPooledTestSyncletsAndConnectors(
          createTestFileConnector,
          count,
        );

        const connectors = syncletsAndConnectors.map(
          ([, connector]) => connector,
        );

        for (const [i, connector] of connectors.entries()) {
          await connector.setAtomForTest('A' + (i + 1));
          await expectEquivalentConnectors(connectors);
        }
      });

      test('chain', async () => {
        const connectors = await getChainedTestConnectors(
          createTestFileConnector,
          count,
        );

        for (const [i, connector] of connectors.entries()) {
          await connector.setAtomForTest('A' + (i + 1));
          await expectEquivalentConnectors(connectors);
        }
      });

      test('ring', async () => {
        const connectors = await getChainedTestConnectors(
          createTestFileConnector,
          count,
          true,
        );

        for (const [i, connector] of connectors.entries()) {
          await connector.setAtomForTest('A' + (i + 1));
          await expectEquivalentConnectors(connectors);
        }
      });
    });
  },
);
