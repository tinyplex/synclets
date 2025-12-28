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
import {
  type DatabaseDataConnectorOptions,
  type DatabaseMetaConnectorOptions,
} from 'synclets/database';
import {getUniqueId} from 'synclets/utils';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
  type TestContext,
} from 'vitest';

let port = 0;
export const allocatePort = (reserve = 1): number => {
  const basePort = 10000 + (process.pid % 100) * 100 + port;
  port += reserve;
  return basePort;
};

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

export const AsyncFunction = Object.getPrototypeOf(
  async () => null,
).constructor;

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
    transport?: Transport | Transport[],
    options?: SyncletOptions,
  ) => Promise<TestSynclet>,
  createDataConnector: (syncletNumber: number) => DataConnector<Depth>,
  createMetaConnector: (syncletNumber: number) => MetaConnector<Depth>,
  createTransport: (
    uniqueId: string,
    syncletNumber: number,
    transportNumber: number,
  ) => Transport | undefined,
  number: number,
  start = true,
  log = false,
): Promise<TestSynclet[]> => {
  const uniqueId = getUniqueId();
  return await Promise.all(
    new Array(number).fill(0).map(async (_, i) => {
      const dataConnector = createDataConnector(i);
      const metaConnector = createMetaConnector(i);
      const transport = createTransport(uniqueId, i, 0);
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
    transport: Transport | Transport[] | undefined,
    options?: SyncletOptions,
  ) => Promise<TestSynclet>,
  createDataConnector: (syncletNumber: number) => DataConnector<Depth>,
  createMetaConnector: (syncletNumber: number) => MetaConnector<Depth>,
  createTransport: (
    uniqueId: string,
    syncletNumber: number,
    transportNumber: number,
  ) => Transport | undefined,
  number: number,
  loop = false,
  start = true,
  log = false,
): Promise<TestSynclet[]> => {
  const uniqueId = getUniqueId();
  return await Promise.all(
    new Array(number).fill(0).map(async (_, i) => {
      const dataConnector = createDataConnector(i);
      const metaConnector = createMetaConnector(i);
      const transports = [];
      if (i != number - 1 || loop) {
        // forward transport
        const transport = createTransport(
          uniqueId + (i == number - 1 ? 0 : i + 1),
          i,
          0,
        );
        if (transport) {
          transports.push(transport);
        }
      }
      if (i != 0 || loop) {
        // backward transport
        const transport = createTransport(uniqueId + i, i, 1);
        if (transport) {
          transports.push(transport);
        }
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

export const createMockDataConnector = <const Depth extends number>(options: {
  readonly depth: Depth;
}) =>
  createDataConnector(options, {
    readAtom: async () => 0,
    writeAtom: async () => {},
    removeAtom: async () => {},
    readChildIds: async () => [],
  }) as DataConnector<Depth>;

export const createMockMetaConnector = <const Depth extends number>(options: {
  readonly depth: Depth;
}) =>
  createMetaConnector(options, {
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

export const describeCommonSyncletTests = <
  DataConnectorType extends DataConnector<number>,
  MetaConnectorType extends MetaConnector<number>,
  AllEnvironment,
  EachEnvironment,
>(
  beforeAllSyncletTests: () => Promise<AllEnvironment>,
  afterAllSyncletTests: (allEnvironment: AllEnvironment) => Promise<void>,
  beforeEachSyncletTest: (
    allEnvironment: AllEnvironment,
  ) => Promise<EachEnvironment>,
  afterEachSyncletTest: (eachEnvironment: EachEnvironment) => Promise<void>,
  createDataConnector: (
    depth: number,
    eachEnvironment: EachEnvironment,
  ) => DataConnectorType,
  createMetaConnector: (
    depth: number,
    eachEnvironment: EachEnvironment,
    syncletNumber: number,
  ) => MetaConnectorType,
  createTransport: (
    uniqueId: string,
    eachEnvironment: EachEnvironment,
    syncletNumber: number,
    transportNumber: number,
  ) => Transport | undefined,
  transportPause = 1,
  onlyDepths: number[] = [1, 2, 3, 4],
  onlyNWay: number[] = [3, 10],
  onlyNWayTypes: string[] = ['pool', 'chain', 'ring'],
) =>
  describe(`common connector tests`, () => {
    let allEnvironment: AllEnvironment;
    let eachEnvironment: EachEnvironment;

    beforeAll(async () => (allEnvironment = await beforeAllSyncletTests()));

    afterAll(async () => await afterAllSyncletTests(allEnvironment));

    beforeEach(
      async () =>
        (eachEnvironment = await beforeEachSyncletTest(allEnvironment)),
    );

    afterEach(async () => await afterEachSyncletTest(eachEnvironment));

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
        if (!onlyDepths.includes(depth)) {
          return;
        }

        interface TestSynclet extends Synclet<Depth> {
          setAtomForTest(value: string): Promise<void>;
          setNearAtomForTest(value: string): Promise<void>;
          setFarAtomForTest(value: string): Promise<void>;
          delAtomForTest(): Promise<void>;
        }

        const createTestDataConnector = (
          syncletNumber: number,
        ): DataConnectorType =>
          createDataConnector(depth, allEnvironment, syncletNumber);

        const createTestMetaConnector = (
          syncletNumber: number,
        ): MetaConnectorType =>
          createMetaConnector(depth, allEnvironment, syncletNumber);

        const createTestTransport = (
          uniqueId: string,
          syncletNumber: number,
          transportNumber: number,
        ): Transport | undefined =>
          createTransport(
            uniqueId,
            allEnvironment,
            syncletNumber,
            transportNumber,
          );

        const createTestSynclet = async (
          dataConnector: any,
          metaConnector: any,
          transport: Transport | Transport[] | undefined,
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
                createTestTransport,
                2,
              );

            await expectEquivalentSynclets([synclet1, synclet2], test);
            await synclet1.destroy();
            await synclet2.destroy();
          });

          test('connected', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTestTransport,
                2,
              );

            await synclet1.setAtomForTest('A');
            await pause(transportPause);
            await expectEquivalentSynclets([synclet1, synclet2], test);

            await synclet2.setAtomForTest('B');
            await pause(transportPause);
            await expectEquivalentSynclets([synclet1, synclet2], test);

            await synclet1.destroy();
            await synclet2.destroy();
          });

          test('connected, deletion', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTestTransport,
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

            await synclet1.destroy();
            await synclet2.destroy();
          });

          test('start 1, set 1, start 2', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTestTransport,
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

            await synclet1.destroy();
            await synclet2.destroy();
          });

          test('start 2, set 1, start 1', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTestTransport,
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

            await synclet1.destroy();
            await synclet2.destroy();
          });

          test('stop 1, set 1, start 1', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTestTransport,
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

            await synclet1.destroy();
            await synclet2.destroy();
          });

          test('stop 1, set 2, start 1', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTestTransport,
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

            await synclet1.destroy();
            await synclet2.destroy();
          });

          test('set 1, set 2, start 2, start 1', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTestTransport,
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

            await synclet1.destroy();
            await synclet2.destroy();
          });

          test('connected, near atom', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTestTransport,
                2,
              );

            await synclet1.setAtomForTest('A');
            await synclet2.setNearAtomForTest('B');
            await pause(transportPause);
            await expectEquivalentSynclets([synclet1, synclet2], test);

            await synclet1.destroy();
            await synclet2.destroy();
          });

          test('connected, far atom', async (test) => {
            if (farAddress) {
              const [synclet1, synclet2] =
                await createPooledTestSyncletsAndConnectors(
                  createTestSynclet,
                  createTestDataConnector,
                  createTestMetaConnector,
                  createTestTransport,
                  2,
                );
              await synclet1.setAtomForTest('A');
              await synclet2.setFarAtomForTest('B');
              await pause(transportPause);
              await expectEquivalentSynclets([synclet1, synclet2], test);

              await synclet1.destroy();
              await synclet2.destroy();
            }
          });

          test('disconnected, near atom', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTestTransport,
                2,
                false,
              );
            await synclet1.setAtomForTest('A');
            await synclet2.setNearAtomForTest('B');
            await synclet1.start();
            await synclet2.start();
            await pause(transportPause);
            await expectEquivalentSynclets([synclet1, synclet2], test);

            await synclet1.destroy();
            await synclet2.destroy();
          });

          test('disconnected, far atom', async (test) => {
            if (farAddress) {
              const [synclet1, synclet2] =
                await createPooledTestSyncletsAndConnectors(
                  createTestSynclet,
                  createTestDataConnector,
                  createTestMetaConnector,
                  createTestTransport,
                  2,
                  false,
                );
              await synclet1.setAtomForTest('A');
              await synclet2.setFarAtomForTest('B');
              await synclet1.start();
              await synclet2.start();
              await pause(transportPause * 2);
              await expectEquivalentSynclets([synclet1, synclet2], test);

              await synclet1.destroy();
              await synclet2.destroy();
            }
          });

          test('disconnected, conflicting values', async (test) => {
            const [synclet1, synclet2] =
              await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTestTransport,
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

            await synclet1.destroy();
            await synclet2.destroy();
          });

          test('disconnected, conflicting values 2', async (test) => {
            if (farAddress) {
              const [synclet1, synclet2] =
                await createPooledTestSyncletsAndConnectors(
                  createTestSynclet,
                  createTestDataConnector,
                  createTestMetaConnector,
                  createTestTransport,
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

              await synclet1.destroy();
              await synclet2.destroy();
            }
          });
        });

        describe.each(onlyNWay)('%d-way', (count: number) => {
          test('pool', async (test) => {
            if (onlyNWayTypes.includes('pool')) {
              const synclets = await createPooledTestSyncletsAndConnectors(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTestTransport,
                count,
              );

              for (const [i, synclet] of synclets.entries()) {
                await synclet.setAtomForTest('A' + (i + 1));
                await pause(transportPause * count);
                await expectEquivalentSynclets(synclets, test);
              }

              for (const synclet of synclets.values()) {
                await synclet.destroy();
              }
            }
          });

          test('chain', async (test) => {
            if (onlyNWayTypes.includes('chain')) {
              const synclets = await createChainedTestSynclets(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTestTransport,
                count,
              );

              for (const [i, synclet] of synclets.entries()) {
                await synclet.setAtomForTest('A' + (i + 1));
                await pause(transportPause * count);
                await expectEquivalentSynclets(synclets, test);
              }

              for (const synclet of synclets.values()) {
                await synclet.destroy();
              }
            }
          });

          test('ring', async (test) => {
            if (onlyNWayTypes.includes('ring')) {
              const synclets = await createChainedTestSynclets(
                createTestSynclet,
                createTestDataConnector,
                createTestMetaConnector,
                createTestTransport,
                count,
                true,
              );

              for (const [i, synclet] of synclets.entries()) {
                await synclet.setAtomForTest('A' + (i + 1));
                await pause(transportPause * count);
                await expectEquivalentSynclets(synclets, test);
              }

              for (const synclet of synclets.values()) {
                await synclet.destroy();
              }
            }
          });
        });
      },
    );
  });

export const describeSchemaTests = <DB, Depth extends number>(
  dbName: string,
  createDb: () => Promise<DB> | DB,
  closeDb: (db: DB) => Promise<void> | void,
  query: (db: DB, sql: string) => Promise<any>,
  getTableSchema: (
    db: DB,
    table: string,
  ) => Promise<{[column: string]: string}>,
  createDataConnector: (
    db: DB,
    options: DatabaseDataConnectorOptions<Depth>,
  ) => DataConnector<Depth>,
  createMetaConnector: (
    db: DB,
    options: DatabaseMetaConnectorOptions<Depth>,
  ) => MetaConnector<Depth>,
) => {
  describe('data schema checks', async () => {
    let db: DB;

    beforeAll(async () => {
      db = await createDb();
    });

    afterEach(async () => await query(db, 'DROP TABLE IF EXISTS data;'));

    afterAll(async () => {
      await closeDb(db);
    });

    test('create if table missing', async () => {
      const logger = {info: vi.fn()};
      const dataConnector = createDataConnector(db, {
        depth: 3 as Depth,
      });
      const metaConnector = createMockMetaConnector({depth: 3 as Depth});
      const synclet = await createSynclet(
        {dataConnector, metaConnector},
        {},
        {logger, id: ''},
      );

      const schema = await getTableSchema(db, 'data');
      expect(schema).toEqual({
        address: 'text',
        atom: 'text',
        address1: 'text',
        address2: 'text',
        address3: 'text',
      });
      expect(logger.info).toHaveBeenCalledWith('[] Creating table "data"');

      await synclet.destroy();
    });

    test('create if table missing, custom options', async () => {
      const logger = {info: vi.fn()};
      const dataConnector = createDataConnector(db, {
        depth: 3 as Depth,
        dataTable: 'd',
        addressColumn: 'a',
        atomColumn: 'x',
      });
      const metaConnector = createMockMetaConnector({depth: 3 as Depth});
      const synclet = await createSynclet(
        {dataConnector, metaConnector},
        {},
        {logger, id: ''},
      );

      const schema = await getTableSchema(db, 'd');
      expect(schema).toEqual({
        a: 'text',
        x: 'text',
        a1: 'text',
        a2: 'text',
        a3: 'text',
      });
      expect(logger.info).toHaveBeenCalledWith('[] Creating table "d"');

      await synclet.destroy();
    });

    test('no error if table is correct', async () => {
      await query(
        db,
        `
        CREATE TABLE data (
          address TEXT, 
          address1 TEXT, 
          address2 TEXT, 
          address3 TEXT, 
          atom TEXT
        );
        `,
      );
      const dataConnector = createDataConnector(db, {
        depth: 3 as Depth,
      });
      const metaConnector = createMockMetaConnector({depth: 3 as Depth});
      const synclet = await createSynclet({dataConnector, metaConnector});
      await synclet.destroy();
    });

    test('error if table has wrong number of columns', async () => {
      await query(
        db,
        `
        CREATE TABLE data (
          address TEXT, 
          address1 TEXT, 
          address2 TEXT, 
          atom TEXT
        );
        `,
      );
      const dataConnector = createDataConnector(db, {
        depth: 3 as Depth,
      });
      const metaConnector = createMockMetaConnector({depth: 3 as Depth});
      await expect(() =>
        createSynclet({dataConnector, metaConnector}),
      ).rejects.toThrow('Table "data" needs correct schema');
    });

    test('error if table has wrong type of columns', async () => {
      await query(
        db,
        `
        CREATE TABLE data (
          address TEXT, 
          address1 TEXT, 
          address2 TEXT, 
          address3 INTEGER, 
          atom TEXT
        );
        `,
      );
      const dataConnector = createDataConnector(db, {depth: 3 as Depth});
      const metaConnector = createMockMetaConnector({depth: 3 as Depth});
      await expect(() =>
        createSynclet({dataConnector, metaConnector}),
      ).rejects.toThrow('Table "data" needs correct schema');
    });

    test('error if table needs address', async () => {
      await query(
        db,
        `
        CREATE TABLE data (
          whoops TEXT, 
          address1 TEXT, 
          address2 TEXT, 
          address3 TEXT, 
          atom TEXT
        );
        `,
      );
      const dataConnector = createDataConnector(db, {depth: 3 as Depth});
      const metaConnector = createMockMetaConnector({depth: 3 as Depth});
      await expect(() =>
        createSynclet({dataConnector, metaConnector}),
      ).rejects.toThrow('Table "data" needs correct schema');
    });

    test('error if table needs atom', async () => {
      await query(
        db,
        `
        CREATE TABLE data (
          address TEXT, 
          address1 TEXT, 
          address2 TEXT, 
          address3 TEXT, 
          whoops TEXT
        );
        `,
      );
      const dataConnector = createDataConnector(db, {depth: 3 as Depth});
      const metaConnector = createMockMetaConnector({depth: 3 as Depth});
      await expect(() =>
        createSynclet({dataConnector, metaConnector}),
      ).rejects.toThrow('Table "data" needs correct schema');
    });

    test('error if table needs addressN', async () => {
      await query(
        db,
        `
        CREATE TABLE data (
          address TEXT, 
          address1 TEXT, 
          address2 TEXT, 
          whoops TEXT, 
          atom TEXT
        );
        `,
      );
      const dataConnector = createDataConnector(db, {depth: 3 as Depth});
      const metaConnector = createMockMetaConnector({depth: 3 as Depth});
      await expect(() =>
        createSynclet({dataConnector, metaConnector}),
      ).rejects.toThrow('Table "data" needs correct schema');
    });
  });

  describe('meta schema checks', async () => {
    let db: DB;

    beforeAll(async () => {
      db = await createDb();
    });

    afterEach(async () => await query(db, 'DROP TABLE IF EXISTS meta;'));

    afterAll(async () => {
      await closeDb(db);
    });

    test('create if table missing', async () => {
      const logger = {info: vi.fn()};
      const dataConnector = createMockDataConnector({depth: 3 as Depth});
      const metaConnector = createMetaConnector(db, {depth: 3 as Depth});
      const synclet = await createSynclet(
        {dataConnector, metaConnector},
        {},
        {logger, id: ''},
      );

      const schema = await getTableSchema(db, 'meta');
      expect(schema).toEqual({
        address: 'text',
        timestamp: 'text',
        address1: 'text',
        address2: 'text',
        address3: 'text',
      });
      expect(logger.info).toHaveBeenCalledWith('[] Creating table "meta"');

      await synclet.destroy();
    });

    test('create if table missing, custom options', async () => {
      const logger = {info: vi.fn()};
      const dataConnector = createMockDataConnector({depth: 3 as Depth});
      const metaConnector = createMetaConnector(db, {
        depth: 3 as Depth,
        metaTable: 'm',
        addressColumn: 'a',
        timestampColumn: 't',
      });
      const synclet = await createSynclet(
        {dataConnector, metaConnector},
        {},
        {logger, id: ''},
      );

      const schema = await getTableSchema(db, 'm');
      expect(schema).toEqual({
        a: 'text',
        t: 'text',
        a1: 'text',
        a2: 'text',
        a3: 'text',
      });
      expect(logger.info).toHaveBeenCalledWith('[] Creating table "m"');

      await synclet.destroy();
    });

    test('no error if table is correct', async () => {
      await query(
        db,
        `
        CREATE TABLE meta (
          address TEXT, 
          address1 TEXT, 
          address2 TEXT, 
          address3 TEXT, 
          timestamp TEXT
        );
        `,
      );
      const dataConnector = createMockDataConnector({depth: 3 as Depth});
      const metaConnector = createMetaConnector(db, {depth: 3 as Depth});
      const synclet = await createSynclet({dataConnector, metaConnector});
      await synclet.destroy();
    });

    test('error if table has wrong number of columns', async () => {
      await query(
        db,
        `
        CREATE TABLE meta (
          address TEXT, 
          address1 TEXT, 
          address2 TEXT, 
          timestamp TEXT
        );
        `,
      );
      const dataConnector = createMockDataConnector({depth: 3 as Depth});
      const metaConnector = createMetaConnector(db, {depth: 3 as Depth});
      await expect(() =>
        createSynclet({dataConnector, metaConnector}),
      ).rejects.toThrow('Table "meta" needs correct schema');
    });

    test('error if table has wrong type of columns', async () => {
      await query(
        db,
        `
        CREATE TABLE meta (
          address TEXT, 
          address1 TEXT, 
          address2 INTEGER, 
          address3 TEXT, 
          timestamp TEXT
        );
        `,
      );
      const dataConnector = createMockDataConnector({depth: 3 as Depth});
      const metaConnector = createMetaConnector(db, {depth: 3 as Depth});
      await expect(() =>
        createSynclet({dataConnector, metaConnector}),
      ).rejects.toThrow('Table "meta" needs correct schema');
    });

    test('error if table needs address', async () => {
      await query(
        db,
        `
        CREATE TABLE meta (
          whoops TEXT, 
          address1 TEXT, 
          address2 TEXT, 
          address3 TEXT, 
          timestamp TEXT
        );
        `,
      );
      const dataConnector = createMockDataConnector({depth: 3 as Depth});
      const metaConnector = createMetaConnector(db, {depth: 3 as Depth});
      await expect(() =>
        createSynclet({dataConnector, metaConnector}),
      ).rejects.toThrow('Table "meta" needs correct schema');
    });

    test('error if table needs timestamp', async () => {
      await query(
        db,
        `
        CREATE TABLE meta (
          address TEXT, 
          address1 TEXT, 
          address2 TEXT, 
          address3 TEXT, 
          whoops TEXT
        );
        `,
      );
      const dataConnector = createMockDataConnector({depth: 3 as Depth});
      const metaConnector = createMetaConnector(db, {depth: 3 as Depth});
      await expect(() =>
        createSynclet({dataConnector, metaConnector}),
      ).rejects.toThrow('Table "meta" needs correct schema');
    });

    test('error if table needs addressN', async () => {
      await query(
        db,
        `
        CREATE TABLE meta (
          address TEXT, 
          address1 TEXT, 
          address2 TEXT, 
          whoops TEXT, 
          timestamp TEXT
        );
        `,
      );
      const dataConnector = createMockDataConnector({depth: 3 as Depth});
      const metaConnector = createMetaConnector(db, {depth: 3 as Depth});
      await expect(() =>
        createSynclet({dataConnector, metaConnector}),
      ).rejects.toThrow('Table "meta" needs correct schema');
    });
  });
};
