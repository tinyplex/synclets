import {mkdtemp, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {Connector, ConnectorOptions, Data, Meta} from 'synclets';
import {createFileConnector} from 'synclets/connector/fs';
import {createMemoryConnector} from 'synclets/connector/memory';
import {getUniqueId} from 'synclets/utils';
import {
  expectDifferingConnectors,
  expectEquivalentConnectors,
  getChainedTestConnectors,
  getPooledTestSyncletsAndConnectors,
  pause,
} from '../common.ts';

interface TestMemoryConnector extends Connector {
  setAtomForTest(value: string): Promise<void>;
  setNearAtomForTest(value: string): Promise<void>;
  setFarAtomForTest(value: string): Promise<void>;
  delAtomForTest(): Promise<void>;
  getDataForTest(): Data;
  getMetaForTest(): Meta;
  getUnderlyingMetaForTest(): Promise<string>;
}

describe.each([
  [
    'memory',
    (atomDepth: number, options: ConnectorOptions) =>
      createMemoryConnector(atomDepth, {}, options),
    async (connector: Connector) => connector.getMeta(),
  ],
  [
    'file',
    (atomDepth: number, options: ConnectorOptions, {file}: {file: string}) =>
      createFileConnector(atomDepth, join(file, getUniqueId()), options),
    async (connector: Connector) => connector.getMeta(),
    async () => ({file: await mkdtemp(tmpdir() + sep)}),
    async ({file}: {file: string}) =>
      await rm(file, {recursive: true, force: true}),
  ],
])(
  '%s connector',
  (
    _,
    createConnector: (
      atomDepth: number,
      options: ConnectorOptions,
      environment: any,
    ) => Promise<Connector>,
    getUnderlyingMetaForTest?: (connector: Connector) => Promise<any>,
    before?: () => Promise<any>,
    after?: (environment: any) => Promise<any>,
  ) => {
    let environment: any;

    beforeAll(async () => (environment = await before?.()));

    afterAll(async () => await after?.(environment));

    describe.each([
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
        nearAddress: string[],
        farAddress?: string[],
      ) => {
        const createTestMemoryConnector = async (
          options: ConnectorOptions = {},
        ): Promise<TestMemoryConnector> => {
          const connector = await createConnector(
            atomDepth,
            options,
            environment,
          );

          return {
            ...connector,

            setAtomForTest: async (value: string) =>
              await connector.setAtom(address, value),

            setNearAtomForTest: async (value: string) => {
              await connector.setAtom(nearAddress, value);
            },

            setFarAtomForTest: async (value: string) => {
              if (farAddress) {
                await connector.setAtom(farAddress, value);
              }
            },

            delAtomForTest: async () => connector.delAtom(address),

            getDataForTest: connector.getData,

            getMetaForTest: connector.getMeta,

            getUnderlyingMetaForTest: async () =>
              await getUnderlyingMetaForTest?.(connector),
          };
        };

        describe('2-way', () => {
          test('connected, initial', async () => {
            const [[, connector1], [, connector2]] =
              await getPooledTestSyncletsAndConnectors(
                createTestMemoryConnector,
                2,
              );

            await expectEquivalentConnectors([connector1, connector2]);
          });

          test('connected', async () => {
            const [[, connector1], [, connector2]] =
              await getPooledTestSyncletsAndConnectors(
                createTestMemoryConnector,
                2,
              );

            await connector1.setAtomForTest('A');
            await expectEquivalentConnectors([connector1, connector2]);

            await connector2.setAtomForTest('B');
            await expectEquivalentConnectors([connector1, connector2]);
          });

          test('connected, deletion', async () => {
            const [[, connector1], [, connector2]] =
              await getPooledTestSyncletsAndConnectors(
                createTestMemoryConnector,
                2,
              );

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
                createTestMemoryConnector,
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
                createTestMemoryConnector,
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
                createTestMemoryConnector,
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
                createTestMemoryConnector,
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
                createTestMemoryConnector,
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
            const [[, connector1], [, connector2]] =
              await getPooledTestSyncletsAndConnectors(
                createTestMemoryConnector,
                2,
              );

            await connector1.setAtomForTest('A');
            await connector2.setNearAtomForTest('B');

            await expectEquivalentConnectors([connector1, connector2]);
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
              await expectEquivalentConnectors([connector1, connector2]);
            }
          });

          test('disconnected, near atom', async () => {
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
            await expectEquivalentConnectors([connector1, connector2]);
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
              await expectEquivalentConnectors([connector1, connector2]);
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
            await expectEquivalentConnectors([connector1, connector2]);
          });

          test('disconnected, conflicting values 2', async () => {
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
            const syncletsAndConnectors =
              await getPooledTestSyncletsAndConnectors(
                createTestMemoryConnector,
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
              createTestMemoryConnector,
              count,
            );

            for (const [i, connector] of connectors.entries()) {
              await connector.setAtomForTest('A' + (i + 1));
              await expectEquivalentConnectors(connectors);
            }
          });

          test('ring', async () => {
            const connectors = await getChainedTestConnectors(
              createTestMemoryConnector,
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
  },
);
