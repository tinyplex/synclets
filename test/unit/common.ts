import console from 'console';
import {join} from 'path';
import {
  createDataConnector,
  createMetaConnector,
  createSynclet,
  createTransport,
  type DataConnector,
  type MetaConnector,
  type Synclet,
  type SyncletOptions,
  type Transport,
} from 'synclets';
import {getUniqueId} from 'synclets/utils';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test,
  type TestContext,
} from 'vitest';

const retriesPerTest = new Map<string, number>();
const assertionsPerTest = new Map<string, number>();
const getFileSnapshot = (type: string, {task}: TestContext & object) => {
  const state = expect.getState();
  const testName = state?.currentTestName;
  const fileTestName = state?.snapshotState?.testFilePath + '/' + testName;

  const lastRetry = retriesPerTest.get(fileTestName) ?? -1;
  const {retry = 0} = task?.meta as any;
  if (retry != lastRetry) {
    retriesPerTest.set(fileTestName, retry);
    assertionsPerTest.set(fileTestName, 0);
  }

  const assertion = (assertionsPerTest.get(fileTestName) ?? 0) + 1;
  assertionsPerTest.set(fileTestName, assertion);
  return join(__dirname, '__snapshots__', `${testName}.${type} #${assertion}`);
};

export const pause = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getTimeFunctions = (): [
  reset: () => void,
  getNow: () => number,
  pause: (ms?: number) => Promise<void>,
] => {
  let time = 0;
  return [
    () => (time = new Date('2026-01-01 00:00:00 UTC').valueOf()),
    () => time,
    async (ms = 50): Promise<void> => {
      time += ms;
      return pause(ms);
    },
  ];
};

export const createPooledTestSyncletsAndConnectors = async <
  Depth extends number,
  TestSynclet extends Synclet<Depth>,
>(
  createSynclet: (
    dataConnector: DataConnector<Depth>,
    metaConnector: MetaConnector<Depth>,
    transport: Transport | Transport[],
    options?: SyncletOptions,
  ) => Promise<TestSynclet>,
  createDataConnector: () => DataConnector<Depth>,
  createMetaConnector: () => MetaConnector<Depth>,
  createTransport: (uniqueId: string) => Transport,
  number: number,
  start = true,
  log = false,
): Promise<TestSynclet[]> => {
  const uniqueId = getUniqueId();
  return await Promise.all(
    new Array(number).fill(0).map(async (_, i) => {
      const dataConnector = createDataConnector();
      const metaConnector = createMetaConnector();
      const transport = createTransport(uniqueId);
      const synclet = await createSynclet(
        dataConnector,
        metaConnector,
        transport,
        {id: 'synclet' + (i + 1), logger: log ? console : undefined},
      );
      if (start) {
        await synclet.start();
      }
      return synclet;
    }),
  );
};

export const createChainedTestSynclets = async <
  Depth extends number,
  TestSynclet extends Synclet<Depth>,
>(
  createSynclet: (
    dataConnector: DataConnector<Depth>,
    metaConnector: MetaConnector<Depth>,
    transport: Transport | Transport[],
    options?: SyncletOptions,
  ) => Promise<TestSynclet>,
  createDataConnector: () => DataConnector<Depth>,
  createMetaConnector: () => MetaConnector<Depth>,
  createTransport: (uniqueId: string) => Transport,
  number: number,
  loop = false,
  start = true,
  log = false,
): Promise<TestSynclet[]> => {
  const uniqueId = getUniqueId();
  return await Promise.all(
    new Array(number).fill(0).map(async (_, i) => {
      const dataConnector = createDataConnector();
      const metaConnector = createMetaConnector();
      const transports = [];
      if (i != 0 || loop) {
        transports.push(createTransport(uniqueId + i));
      }
      if (i != number - 1 || loop) {
        transports.push(
          createTransport(uniqueId + (i == number - 1 ? 0 : i + 1)),
        );
      }
      const synclet = await createSynclet(
        dataConnector,
        metaConnector,
        transports,
        {id: 'synclet' + (i + 1), logger: log ? console : undefined},
      );
      if (start) {
        await synclet.start();
      }
      return synclet;
    }),
  );
};

export const createMockDataConnector = <Depth extends number>(depth: Depth) =>
  createDataConnector(depth, {
    readAtom: async () => 0,
    writeAtom: async () => {},
    removeAtom: async () => {},
    readChildIds: async () => [],
  }) as DataConnector<Depth>;

export const createMockMetaConnector = <Depth extends number>(depth: Depth) =>
  createMetaConnector(depth, {
    readTimestamp: async () => '',
    writeTimestamp: async () => {},
    readChildIds: async () => [],
  }) as MetaConnector<Depth>;

export const createMockTransport = () =>
  createTransport({
    sendPacket: async () => {},
  });

export const expectEquivalentSynclets = async <Depth extends number>(
  synclets: Synclet<Depth>[],
  test: TestContext & object,
) => {
  const data = await synclets[0].getData();
  const meta = await synclets[0].getMeta();

  await expect(data).toMatchFileSnapshot(getFileSnapshot('equivalent', test));
  await Promise.all(
    synclets.map(async (synclet) => {
      expect(await synclet.getData()).toEqual(data);
      expect(await synclet.getMeta()).toEqual(meta);
    }),
  );
};

export const expectDifferingSynclets = async <Depth extends number>(
  synclet1: Synclet<Depth>,
  synclet2: Synclet<Depth>,
  test: TestContext & object,
) => {
  const data1 = await synclet1.getData();
  const data2 = await synclet2.getData();
  expect(data1).not.toEqual(data2);
  await expect([data1, data2]).toMatchFileSnapshot(
    getFileSnapshot('differing', test),
  );

  expect(await synclet1.getMeta()).not.toEqual(await synclet2.getMeta());
  expect(await synclet1.getMeta()).not.toEqual(await synclet2.getMeta());
};

export const describeCommonConnectorTests = <
  DataConnectorType extends DataConnector<number>,
  MetaConnectorType extends MetaConnector<number>,
  Environment,
>(
  before: () => Promise<Environment>,
  after: (environment: Environment) => Promise<void>,
  createDataConnector: (
    depth: number,
    environment: Environment,
  ) => DataConnectorType,
  createMetaConnector: (
    depth: number,
    environment: Environment,
  ) => MetaConnectorType,
  createTransport: (uniqueId: string) => Transport,
  transportPause = 1,
  onlyDepths: number[] = [1, 2, 3, 4],
) =>
  describe(`common connector tests`, () => {
    let environment: Environment;

    beforeAll(async () => (environment = await before()));

    afterAll(async () => await after(environment));

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
      <Depth extends number>(
        depth: Depth,
        address: string[],
        nearAddress: string[],
        farAddress?: string[],
      ) => {
        if (onlyDepths.indexOf(depth) === -1) {
          return;
        }

        interface TestSynclet extends Synclet<Depth> {
          setAtomForTest(value: string): Promise<void>;
          setNearAtomForTest(value: string): Promise<void>;
          setFarAtomForTest(value: string): Promise<void>;
          delAtomForTest(): Promise<void>;
        }

        const createTestDataConnector = (): DataConnectorType =>
          createDataConnector(depth, environment);

        const createTestMetaConnector = (): MetaConnectorType =>
          createMetaConnector(depth, environment);

        const createTestSynclet = async (
          dataConnector: any,
          metaConnector: any,
          transport: Transport | Transport[],
          options: SyncletOptions = {},
        ): Promise<TestSynclet> => {
          const synclet = await createSynclet(
            {dataConnector, metaConnector, transport},
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
          };
        };

        describe('2-way', () => {
          test('connected, initial', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTransport,
                2,
              );

            await expectEquivalentSynclets([synclet1, synclet2], test);
          });

          test('connected', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTransport,
                2,
              );

            await synclet1.setAtomForTest('A');
            await pause(transportPause);
            await expectEquivalentSynclets([synclet1, synclet2], test);

            await synclet2.setAtomForTest('B');
            await pause(transportPause);
            await expectEquivalentSynclets([synclet1, synclet2], test);
          });

          test('connected, deletion', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTransport,
                2,
              );

            await synclet1.setAtomForTest('A');
            await pause(transportPause);
            await expectEquivalentSynclets([synclet1, synclet2], test);

            const meta = await synclet1.getMeta();
            await synclet1.delAtomForTest();
            await pause(transportPause);
            await expectEquivalentSynclets([synclet1, synclet2], test);
            expect(meta).not.toEqual(await synclet1.getMeta());
          });

          test('start 1, set 1, start 2', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTransport,
                2,
                false,
              );

            await synclet1.start();

            await synclet1.setAtomForTest('A');
            await pause(transportPause);
            await expectDifferingSynclets(synclet1, synclet2, test);

            await synclet2.start();
            await pause(transportPause);
            await expectEquivalentSynclets([synclet1, synclet2], test);
          });

          test('start 2, set 1, start 1', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTransport,
                2,
                false,
              );

            await synclet2.start();
            await synclet1.setAtomForTest('A');
            await pause(transportPause);
            await expectDifferingSynclets(synclet1, synclet2, test);

            await synclet1.start();
            await pause(transportPause);
            await expectEquivalentSynclets([synclet1, synclet2], test);
          });

          test('stop 1, set 1, start 1', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTransport,
                2,
              );

            await synclet1.setAtomForTest('A');
            await pause(transportPause);
            await expectEquivalentSynclets([synclet1, synclet2], test);

            await synclet1.stop();
            await synclet1.setAtomForTest('B');
            await pause(transportPause);
            await expectDifferingSynclets(synclet1, synclet2, test);

            await synclet1.start();
            await pause(transportPause);
            await expectEquivalentSynclets([synclet1, synclet2], test);
          });

          test('stop 1, set 2, start 1', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTransport,
                2,
              );

            await synclet1.setAtomForTest('A');
            await pause(transportPause);
            await expectEquivalentSynclets([synclet1, synclet2], test);

            await synclet1.stop();
            await synclet2.setAtomForTest('B');
            await pause(transportPause);
            await expectDifferingSynclets(synclet1, synclet2, test);

            await synclet1.start();
            await pause(transportPause);
            await expectEquivalentSynclets([synclet1, synclet2], test);
          });

          test('set 1, set 2, start 2, start 1', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTransport,
                2,
                false,
              );

            await synclet1.setAtomForTest('A');
            await pause(transportPause);
            await expectDifferingSynclets(synclet1, synclet2, test);

            await synclet2.setAtomForTest('B');
            await pause(transportPause);
            await expectDifferingSynclets(synclet1, synclet2, test);

            await synclet2.start();
            await synclet1.start();
            await pause(transportPause * 2);
            await expectEquivalentSynclets([synclet1, synclet2], test);
          });

          test('connected, near atom', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTransport,
                2,
              );

            await synclet1.setAtomForTest('A');
            await synclet2.setNearAtomForTest('B');
            await pause(transportPause);
            await expectEquivalentSynclets([synclet1, synclet2], test);
          });

          test('connected, far atom', async (test) => {
            if (farAddress) {
              const [synclet1, synclet2] =
                await createPooledTestSyncletsAndConnectors(
                  createTestSynclet,
                  createTestDataConnector,
                  createTestMetaConnector,
                  createTransport,
                  2,
                );
              await synclet1.setAtomForTest('A');
              await synclet2.setFarAtomForTest('B');
              await pause(transportPause);
              await expectEquivalentSynclets([synclet1, synclet2], test);
            }
          });

          test('disconnected, near atom', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTransport,
                2,
                false,
              );
            await synclet1.setAtomForTest('A');
            await synclet2.setNearAtomForTest('B');
            await synclet1.start();
            await synclet2.start();
            await pause(transportPause);
            await expectEquivalentSynclets([synclet1, synclet2], test);
          });

          test('disconnected, far atom', async (test) => {
            if (farAddress) {
              const [synclet1, synclet2] =
                await createPooledTestSyncletsAndConnectors(
                  createTestSynclet,
                  createTestDataConnector,
                  createTestMetaConnector,
                  createTransport,
                  2,
                  false,
                );
              await synclet1.setAtomForTest('A');
              await synclet2.setFarAtomForTest('B');
              await synclet1.start();
              await synclet2.start();
              await pause(transportPause * 2);
              await expectEquivalentSynclets([synclet1, synclet2], test);
            }
          });

          test('disconnected, conflicting values', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTransport,
                2,
                false,
              );
            await synclet1.setAtomForTest('A');
            await pause(transportPause);
            await synclet1.setAtomForTest('B');
            await synclet1.start();
            await synclet2.start();
            await pause(transportPause * 2);
            await expectEquivalentSynclets([synclet1, synclet2], test);
          });

          test('disconnected, conflicting values 2', async (test) => {
            if (farAddress) {
              const [synclet1, synclet2] =
                await createPooledTestSyncletsAndConnectors(
                  createTestSynclet,
                  createTestDataConnector,
                  createTestMetaConnector,
                  createTransport,
                  2,
                  false,
                );
              await synclet1.setAtomForTest('A');
              await synclet1.setNearAtomForTest('B');
              await pause(transportPause);
              await synclet2.setNearAtomForTest('C');
              await synclet2.setFarAtomForTest('D');
              await synclet1.start();
              await synclet2.start();
              await pause(transportPause * 2);
              await expectEquivalentSynclets([synclet1, synclet2], test);
            }
          });
        });

        describe.each([3, 10])('%d-way', (count: number) => {
          test('pool', async (test) => {
            const synclets = await createPooledTestSyncletsAndConnectors(
              createTestSynclet,
              createTestDataConnector,
              createTestMetaConnector,
              createTransport,
              count,
            );

            for (const [i, synclet] of synclets.entries()) {
              await synclet.setAtomForTest('A' + (i + 1));
              await pause(transportPause * count);
              await expectEquivalentSynclets(synclets, test);
            }
          });

          test('chain', async (test) => {
            const synclets = await createChainedTestSynclets(
              createTestSynclet,
              createTestDataConnector,
              createTestMetaConnector,
              createTransport,
              count,
            );

            for (const [i, synclet] of synclets.entries()) {
              await synclet.setAtomForTest('A' + (i + 1));
              await pause(transportPause * count);
              await expectEquivalentSynclets(synclets, test);
            }
          });

          test('ring', async (test) => {
            const synclets = await createChainedTestSynclets(
              createTestSynclet,
              createTestDataConnector,
              createTestMetaConnector,
              createTransport,
              count,
              true,
            );
            for (const [i, synclet] of synclets.entries()) {
              await synclet.setAtomForTest('A' + (i + 1));
              await pause(transportPause * count);
              await expectEquivalentSynclets(synclets, test);
            }
          });
        });
      },
    );
  });
