/* eslint-disable jest/no-export */
import console from 'console';
import {
  createDataConnector,
  createMetaConnector,
  createSynclet,
  createTransport,
  DataConnector,
  MetaConnector,
  Synclet,
  SyncletOptions,
  Transport,
} from 'synclets';
import {createMemoryTransport} from 'synclets/transport/memory';
import {getUniqueId} from 'synclets/utils';

export interface TestSynclet extends Synclet {
  setAtomForTest(value: string): Promise<void>;
  setNearAtomForTest(value: string): Promise<void>;
  setFarAtomForTest(value: string): Promise<void>;
  delAtomForTest(): Promise<void>;
  getUnderlyingMetaForTest(): Promise<any>;
}

export const describeConnectorTests = (
  type: string,
  createDataConnector: (
    depth: number,
    environment: any,
  ) => Promise<DataConnector>,
  createMetaConnector: (
    depth: number,
    environment: any,
  ) => Promise<MetaConnector>,
  getUnderlyingMeta: (synclet: Synclet) => Promise<any>,
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
        const createTestDataConnector = (): Promise<DataConnector> =>
          createDataConnector(depth, environment);

        const createTestMetaConnector = (): Promise<MetaConnector> =>
          createMetaConnector(depth, environment);

        const createTestSynclet = async (
          dataConnector: DataConnector,
          metaConnector: MetaConnector,
          transport: Transport | Transport[],
          options: SyncletOptions = {},
        ): Promise<TestSynclet> => {
          const synclet = await createSynclet(
            dataConnector,
            metaConnector,
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

            getUnderlyingMetaForTest: () => getUnderlyingMeta(synclet),
          };
        };

        describe('2-way', () => {
          test('connected, initial', async () => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                2,
              );

            await expectEquivalentSynclets([synclet1, synclet2]);
          });

          test('connected', async () => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                2,
              );

            await synclet1.setAtomForTest('A');
            await expectEquivalentSynclets([synclet1, synclet2]);

            await synclet2.setAtomForTest('B');
            await expectEquivalentSynclets([synclet1, synclet2]);
          });

          test('connected, deletion', async () => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
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
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
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
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                2,
                false,
              );

            await synclet2.start();
            await synclet1.getDataConnector().connect();
            await synclet1.getMetaConnector().connect();
            await synclet1.setAtomForTest('A');
            await expectDifferingSynclets(synclet1, synclet2);

            await synclet1.start();
            await expectEquivalentSynclets([synclet1, synclet2]);
          });

          test('stop 1, set 1, start 1', async () => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                2,
                false,
              );

            await synclet1.start();
            await synclet2.start();

            await synclet1.setAtomForTest('A');
            await expectEquivalentSynclets([synclet1, synclet2]);

            await synclet1.stop();
            await synclet1.getDataConnector().connect();
            await synclet1.getMetaConnector().connect();
            await synclet1.setAtomForTest('B');
            await expectDifferingSynclets(synclet1, synclet2);

            await synclet1.start();
            await expectEquivalentSynclets([synclet1, synclet2]);
          });

          test('stop 1, set 2, start 1', async () => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
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
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                2,
                false,
              );

            await synclet1.getDataConnector().connect();
            await synclet1.getMetaConnector().connect();
            await synclet1.setAtomForTest('A');
            await expectDifferingSynclets(synclet1, synclet2);

            await pause();

            await synclet2.getDataConnector().connect();
            await synclet2.getMetaConnector().connect();
            await synclet2.setAtomForTest('B');
            await expectDifferingSynclets(synclet1, synclet2);

            await synclet2.start();
            await synclet1.start();
            await expectEquivalentSynclets([synclet1, synclet2]);
          });

          test('connected, near atom', async () => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                2,
              );

            await synclet1.setAtomForTest('A');
            await synclet2.setNearAtomForTest('B');

            await expectEquivalentSynclets([synclet1, synclet2]);
          });

          test('connected, far atom', async () => {
            if (farAddress) {
              const [synclet1, synclet2] =
                await createPooledTestSyncletsAndConnectors(
                  createTestSynclet,
                  createTestDataConnector,
                  createTestMetaConnector,
                  2,
                );
              await synclet1.setAtomForTest('A');
              await synclet2.setFarAtomForTest('B');
              await expectEquivalentSynclets([synclet1, synclet2]);
            }
          });

          test('disconnected, near atom', async () => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                2,
                false,
              );
            await synclet1.getDataConnector().connect();
            await synclet1.getMetaConnector().connect();
            await synclet2.getDataConnector().connect();
            await synclet2.getMetaConnector().connect();
            await synclet1.setAtomForTest('A');
            await synclet2.setNearAtomForTest('B');
            await synclet1.start();
            await synclet2.start();
            await expectEquivalentSynclets([synclet1, synclet2]);
          });

          test('disconnected, far atom', async () => {
            if (farAddress) {
              const [synclet1, synclet2] =
                await createPooledTestSyncletsAndConnectors(
                  createTestSynclet,
                  createTestDataConnector,
                  createTestMetaConnector,
                  2,
                  false,
                );
              await synclet1.getDataConnector().connect();
              await synclet1.getMetaConnector().connect();
              await synclet2.getDataConnector().connect();
              await synclet2.getMetaConnector().connect();
              await synclet1.setAtomForTest('A');
              await synclet2.setFarAtomForTest('B');
              await synclet1.start();
              await synclet2.start();
              await expectEquivalentSynclets([synclet1, synclet2]);
            }
          });

          test('disconnected, conflicting values', async () => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                2,
                false,
              );
            await synclet1.getDataConnector().connect();
            await synclet1.getMetaConnector().connect();
            await synclet2.getDataConnector().connect();
            await synclet2.getMetaConnector().connect();
            await synclet1.setAtomForTest('A');
            await pause();
            await synclet1.setAtomForTest('B');
            await synclet1.start();
            await synclet2.start();
            await expectEquivalentSynclets([synclet1, synclet2]);
          });

          test('disconnected, conflicting values 2', async () => {
            if (farAddress) {
              const [synclet1, synclet2] =
                await createPooledTestSyncletsAndConnectors(
                  createTestSynclet,
                  createTestDataConnector,
                  createTestMetaConnector,
                  2,
                  false,
                );
              await synclet1.getDataConnector().connect();
              await synclet1.getMetaConnector().connect();
              await synclet2.getDataConnector().connect();
              await synclet2.getMetaConnector().connect();
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
            const synclets = await createPooledTestSyncletsAndConnectors(
              createTestSynclet,
              createTestDataConnector,
              createTestMetaConnector,
              count,
            );

            for (const [i, synclet] of synclets.entries()) {
              await synclet.setAtomForTest('A' + (i + 1));
              await expectEquivalentSynclets(synclets);
            }
          });

          test('chain', async () => {
            const synclets = await createChainedTestSynclets(
              createTestSynclet,
              createTestDataConnector,
              createTestMetaConnector,
              count,
            );

            for (const [i, synclet] of synclets.entries()) {
              await synclet.setAtomForTest('A' + (i + 1));
              await expectEquivalentSynclets(synclets);
            }
          });

          test('ring', async () => {
            const synclets = await createChainedTestSynclets(
              createTestSynclet,
              createTestDataConnector,
              createTestMetaConnector,
              count,
              true,
            );

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

export const createPooledTestSyncletsAndConnectors = async <
  TestSynclet extends Synclet,
>(
  createSynclet: (
    dataConnector: DataConnector,
    metaConnector: MetaConnector,
    transport: Transport | Transport[],
    options?: SyncletOptions,
  ) => Promise<TestSynclet>,
  createDataConnector: () => Promise<DataConnector>,
  createMetaConnector: () => Promise<MetaConnector>,
  number: number,
  start = true,
  log = false,
): Promise<TestSynclet[]> => {
  const poolId = getUniqueId();
  return await Promise.all(
    new Array(number).fill(0).map(async (_, i) => {
      const logger = log ? console : undefined;
      const dataConnector = await createDataConnector();
      const metaConnector = await createMetaConnector();
      const transport = await createMemoryTransport({poolId, logger});
      const synclet = await createSynclet(
        dataConnector,
        metaConnector,
        transport,
        {
          id: 'synclet' + (i + 1),
          logger,
        },
      );
      if (start) {
        await synclet.start();
      }
      return synclet;
    }),
  );
};

export const createChainedTestSynclets = async <TestSynclet extends Synclet>(
  createSynclet: (
    dataConnector: DataConnector,
    metaConnector: MetaConnector,
    transport: Transport | Transport[],
    options?: SyncletOptions,
  ) => Promise<TestSynclet>,
  createDataConnector: () => Promise<DataConnector>,
  createMetaConnector: () => Promise<MetaConnector>,
  number: number,
  loop = false,
  start = true,
  log = false,
): Promise<TestSynclet[]> => {
  const logger = log ? console : undefined;
  const poolId = getUniqueId();
  return await Promise.all(
    new Array(number).fill(0).map(async (_, i) => {
      const dataConnector = await createDataConnector();
      const metaConnector = await createMetaConnector();
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
      const synclet = await createSynclet(
        dataConnector,
        metaConnector,
        transports,
        {
          id: 'synclet' + (i + 1),
          logger,
        },
      );
      if (start) {
        await synclet.start();
      }
      return synclet;
    }),
  );
};

export const createMockDataConnector = () =>
  createDataConnector(1, {
    readAtom: async () => 0,
    writeAtom: async () => {},
    removeAtom: async () => {},
    readChildIds: async () => [],
  });

export const createMockMetaConnector = () =>
  createMetaConnector(1, {
    readTimestamp: async () => '',
    readHash: async () => 0,
    writeTimestamp: async () => {},
    writeHash: async () => {},
    readChildIds: async () => [],
  });

export const createMockTransport = () =>
  createTransport({
    sendPacket: async () => {},
  });

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
