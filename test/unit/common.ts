/* eslint-disable jest/no-export */
import console from 'console';
import {
  Connector,
  ConnectorOptions,
  createSynclet,
  Synclet,
  SyncletOptions,
  Transport,
} from 'synclets';
import {createMemoryTransport} from 'synclets/transport/memory';
import {getUniqueId} from 'synclets/utils';

interface TestSynclet extends Synclet {
  setAtomForTest(value: string): Promise<void>;
  setNearAtomForTest(value: string): Promise<void>;
  setFarAtomForTest(value: string): Promise<void>;
  delAtomForTest(): Promise<void>;
  getUnderlyingMetaForTest(): Promise<any>;
}

export const describeConnectorTests = (
  type: string,
  createTConnector: (
    depth: number,
    options: ConnectorOptions,
    environment: any,
  ) => Promise<Connector>,
  getUnderlyingMeta: (connector: Connector) => Promise<any>,
  before?: () => Promise<any>,
  after?: (environment: any) => Promise<any>,
) =>
  describe(`${type} connector`, () => {
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
        depth: number,
        address: string[],
        nearAddress: string[],
        farAddress?: string[],
      ) => {
        const createConnector = (
          options: ConnectorOptions = {},
        ): Promise<Connector> => createTConnector(depth, options, environment);

        const createTestSynclet = async (
          connector: Connector,
          transport: Transport | Transport[],
          options: SyncletOptions = {},
        ): Promise<TestSynclet> => {
          const synclet = await createSynclet(
            connector,
            transport,
            {},
            options,
          );
          return {
            ...synclet,

            setAtomForTest: (value: string) => synclet.setAtom(address, value),

            setNearAtomForTest: (value: string) =>
              synclet.setAtom(nearAddress, value),

            setFarAtomForTest: async (value: string) => {
              if (farAddress) {
                await synclet.setAtom(farAddress, value);
              }
            },

            delAtomForTest: () => synclet.delAtom(address),

            getUnderlyingMetaForTest: () => getUnderlyingMeta(connector),
          };
        };

        describe('2-way', () => {
          test('connected, initial', async () => {
            const [[synclet1], [synclet2]] =
              await getPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createConnector,
                2,
              );

            await expectEquivalentSynclets([synclet1, synclet2]);
          });

          test('connected', async () => {
            const [[synclet1], [synclet2]] =
              await getPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createConnector,
                2,
              );

            await synclet1.setAtomForTest('A');
            await expectEquivalentSynclets([synclet1, synclet2]);

            await synclet2.setAtomForTest('B');
            await expectEquivalentSynclets([synclet1, synclet2]);
          });

          test('connected, deletion', async () => {
            const [[synclet1], [synclet2]] =
              await getPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createConnector,
                2,
              );

            await synclet1.setAtomForTest('A');
            await expectEquivalentSynclets([synclet1, synclet2]);

            const meta = await synclet1.getMeta();
            await synclet1.delAtomForTest();
            await expectEquivalentSynclets([synclet1, synclet2]);
            expect(meta).not.toEqual(await synclet1.getMeta());
          });

          test('start 1, set 1, start 2', async () => {
            const [[synclet1], [synclet2]] =
              await getPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createConnector,
                2,
                false,
              );

            await synclet1.start();

            await synclet1.setAtomForTest('A');
            await expectDifferingSynclets(synclet1, synclet2);

            await synclet2.start();
            await expectEquivalentSynclets([synclet1, synclet2]);
          });

          test('start 2, set 1, start 1', async () => {
            const [[synclet1, connector1], [synclet2]] =
              await getPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createConnector,
                2,
                false,
              );

            await synclet2.start();
            await connector1.connect();
            await synclet1.setAtomForTest('A');
            await expectDifferingSynclets(synclet1, synclet2);

            await synclet1.start();
            await expectEquivalentSynclets([synclet1, synclet2]);
          });

          test('stop 1, set 1, start 1', async () => {
            const [[synclet1, connector1], [synclet2]] =
              await getPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createConnector,
                2,
                false,
              );

            await synclet1.start();
            await synclet2.start();

            await synclet1.setAtomForTest('A');
            await expectEquivalentSynclets([synclet1, synclet2]);

            await synclet1.stop();
            await connector1.connect();
            await synclet1.setAtomForTest('B');
            await expectDifferingSynclets(synclet1, synclet2);

            await synclet1.start();
            await expectEquivalentSynclets([synclet1, synclet2]);
          });

          test('stop 1, set 2, start 1', async () => {
            const [[synclet1], [synclet2]] =
              await getPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createConnector,
                2,
                false,
              );

            await synclet1.start();
            await synclet2.start();

            await synclet1.setAtomForTest('A');
            await expectEquivalentSynclets([synclet1, synclet2]);

            await synclet1.stop();
            await synclet2.setAtomForTest('B');
            await expectDifferingSynclets(synclet1, synclet2);

            await synclet1.start();
            await expectEquivalentSynclets([synclet1, synclet2]);
          });

          test('set 1, set 2, start 2, start 1', async () => {
            const [[synclet1, connector1], [synclet2, connector2]] =
              await getPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createConnector,
                2,
                false,
              );

            await connector1.connect();
            await synclet1.setAtomForTest('A');
            await expectDifferingSynclets(synclet1, synclet2);

            await pause();

            await connector2.connect();
            await synclet2.setAtomForTest('B');
            await expectDifferingSynclets(synclet1, synclet2);

            await synclet2.start();
            await synclet1.start();
            await expectEquivalentSynclets([synclet1, synclet2]);
          });

          test('connected, near atom', async () => {
            const [[synclet1], [synclet2]] =
              await getPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createConnector,
                2,
              );

            await synclet1.setAtomForTest('A');
            await synclet2.setNearAtomForTest('B');

            await expectEquivalentSynclets([synclet1, synclet2]);
          });

          test('connected, far atom', async () => {
            if (farAddress) {
              const [[synclet1], [synclet2]] =
                await getPooledTestSyncletsAndConnectors(
                  createTestSynclet,
                  createConnector,
                  2,
                );
              await synclet1.setAtomForTest('A');
              await synclet2.setFarAtomForTest('B');
              await expectEquivalentSynclets([synclet1, synclet2]);
            }
          });

          test('disconnected, near atom', async () => {
            const [[synclet1, connector1], [synclet2, connector2]] =
              await getPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createConnector,
                2,
                false,
              );
            await connector1.connect();
            await connector2.connect();
            await synclet1.setAtomForTest('A');
            await synclet2.setNearAtomForTest('B');
            await synclet1.start();
            await synclet2.start();
            await expectEquivalentSynclets([synclet1, synclet2]);
          });

          test('disconnected, far atom', async () => {
            if (farAddress) {
              const [[synclet1, connector1], [synclet2, connector2]] =
                await getPooledTestSyncletsAndConnectors(
                  createTestSynclet,
                  createConnector,
                  2,
                  false,
                );
              await connector1.connect();
              await connector2.connect();
              await synclet1.setAtomForTest('A');
              await synclet2.setFarAtomForTest('B');
              await synclet1.start();
              await synclet2.start();
              await expectEquivalentSynclets([synclet1, synclet2]);
            }
          });

          test('disconnected, conflicting values', async () => {
            const [[synclet1, connector1], [synclet2, connector2]] =
              await getPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createConnector,
                2,
                false,
              );
            await connector1.connect();
            await connector2.connect();
            await synclet1.setAtomForTest('A');
            await pause();
            await synclet1.setAtomForTest('B');
            await synclet1.start();
            await synclet2.start();
            await expectEquivalentSynclets([synclet1, synclet2]);
          });

          test('disconnected, conflicting values 2', async () => {
            if (farAddress) {
              const [[synclet1, connector1], [synclet2, connector2]] =
                await getPooledTestSyncletsAndConnectors(
                  createTestSynclet,
                  createConnector,
                  2,
                  false,
                );
              await connector1.connect();
              await connector2.connect();
              await synclet1.setAtomForTest('A');
              await synclet1.setNearAtomForTest('B');
              await pause();
              await synclet2.setNearAtomForTest('C');
              await synclet2.setFarAtomForTest('D');
              await synclet1.start();
              await synclet2.start();
              await expectEquivalentSynclets([synclet1, synclet2]);
            }
          });
        });

        describe.each([3, 10])('%d-way', (count: number) => {
          test('pool', async () => {
            const syncletsAndConnectors =
              await getPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createConnector,
                count,
              );
            const synclets = syncletsAndConnectors.map(([synclet]) => synclet);

            for (const [i, synclet] of synclets.entries()) {
              await synclet.setAtomForTest('A' + (i + 1));
              await expectEquivalentSynclets(synclets);
            }
          });

          test('chain', async () => {
            const syncletsAndConnectors = await getChainedTestSynclets(
              createTestSynclet,
              createConnector,
              count,
            );
            const synclets = syncletsAndConnectors.map(([synclet]) => synclet);

            for (const [i, synclet] of synclets.entries()) {
              await synclet.setAtomForTest('A' + (i + 1));
              await expectEquivalentSynclets(synclets);
            }
          });

          test('ring', async () => {
            const syncletsAndConnectors = await getChainedTestSynclets(
              createTestSynclet,
              createConnector,
              count,
              true,
            );
            const synclets = syncletsAndConnectors.map(([synclet]) => synclet);

            for (const [i, synclet] of synclets.entries()) {
              await synclet.setAtomForTest('A' + (i + 1));
              await expectEquivalentSynclets(synclets);
            }
          });
        });
      },
    );
  });

export const pause = async (ms = 2) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getPooledTestSyncletsAndConnectors = async <
  TestSynclet extends Synclet,
>(
  createSynclet: (
    connector: Connector,
    transport: Transport | Transport[],
    options?: SyncletOptions,
  ) => Promise<TestSynclet>,
  createConnector: (options?: ConnectorOptions) => Promise<Connector>,
  number: number,
  start = true,
  log = false,
): Promise<[TestSynclet, Connector][]> => {
  const poolId = getUniqueId();
  return await Promise.all(
    new Array(number)
      .fill(0)
      .map((_, i) =>
        getPooledTestSyncletAndConnector(
          createSynclet,
          createConnector,
          'synclet' + (i + 1),
          poolId,
          start,
          log,
        ),
      ),
  );
};

export const getPooledTestSyncletAndConnector = async <
  TestSynclet extends Synclet,
>(
  createSynclet: (
    connector: Connector,
    transport: Transport | Transport[],
    options?: SyncletOptions,
  ) => Promise<TestSynclet>,
  createConnector: (options?: ConnectorOptions) => Promise<Connector>,
  id: string = getUniqueId(),
  poolId: string = getUniqueId(),
  start = true,
  log = false,
): Promise<[TestSynclet, Connector]> => {
  const logger = log ? console : undefined;
  const connector = await createConnector({logger});
  const transport = await createMemoryTransport({poolId, logger});
  const synclet = await createSynclet(connector, transport, {id, logger});
  if (start) {
    await synclet.start();
  }
  return [synclet, connector];
};

export const getChainedTestSynclets = async <TestSynclet extends Synclet>(
  createSynclet: (
    connector: Connector,
    transport: Transport | Transport[],
    options?: SyncletOptions,
  ) => Promise<TestSynclet>,
  createConnector: (options?: ConnectorOptions) => Promise<Connector>,
  number: number,
  loop = false,
  start = true,
  log = false,
): Promise<[TestSynclet, Connector][]> => {
  const logger = log ? console : undefined;
  const poolId = getUniqueId();
  return await Promise.all(
    new Array(number).fill(0).map(async (_, i) => {
      const connector = await createConnector({logger});
      const transports = [];
      if (i != 0 || loop) {
        transports.push(
          await createMemoryTransport({poolId: poolId + i, logger}),
        );
      }
      if (i != number - 1 || loop) {
        transports.push(
          await createMemoryTransport({
            poolId: poolId + (i == number - 1 ? 0 : i + 1),
            logger,
          }),
        );
      }
      const synclet = await createSynclet(connector, transports, {
        id: 'synclet' + (i + 1),
        logger,
      });
      if (start) {
        await synclet.start();
      }
      return [synclet, connector];
    }),
  );
};

export const expectEquivalentSynclets = async (synclets: TestSynclet[]) => {
  const data = await synclets[0].getData();
  const meta = await synclets[0].getMeta();
  expect(data).toMatchSnapshot('equivalent');
  await Promise.all(
    synclets.map(async (synclet) => {
      expect(await synclet.getData()).toEqual(data);
      expect(await synclet.getMeta()).toEqual(meta);
      expect(await synclet.getUnderlyingMetaForTest()).toEqual(meta);
    }),
  );
};

export const expectDifferingSynclets = async (
  synclet1: TestSynclet,
  synclet2: TestSynclet,
) => {
  const data1 = await synclet1.getData();
  const data2 = await synclet2.getData();
  expect(data1).not.toEqual(data2);
  expect([data1, data2]).toMatchSnapshot('differing');
  expect(await synclet1.getMeta()).not.toEqual(await synclet2.getMeta());
};
