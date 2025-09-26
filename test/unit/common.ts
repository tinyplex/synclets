/* eslint-disable jest/no-export */
import console from 'console';
import {Connector, ConnectorOptions, createSynclet, Synclet} from 'synclets';
import {createMemoryTransport} from 'synclets/transport/memory';
import {getUniqueId} from 'synclets/utils';

interface TestConnector extends Connector {
  setAtomForTest(value: string): Promise<void>;
  setNearAtomForTest(value: string): Promise<void>;
  setFarAtomForTest(value: string): Promise<void>;
  delAtomForTest(): Promise<void>;
  getUnderlyingMetaForTest(): Promise<any>;
}

export const describeConnectorTests = (
  type: string,
  createConnector: (
    depth: number,
    options: ConnectorOptions,
    environment: any,
  ) => Promise<Connector>,
  getUnderlyingMetaForTest: (connector: Connector) => Promise<any>,
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
        const createTestConnector = async (
          options: ConnectorOptions = {},
        ): Promise<TestConnector> => {
          const connector = await createConnector(depth, options, environment);

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

            getUnderlyingMetaForTest: () => getUnderlyingMetaForTest(connector),
          };
        };

        describe('2-way', () => {
          test('connected, initial', async () => {
            const [[, connector1], [, connector2]] =
              await getPooledTestSyncletsAndConnectors(createTestConnector, 2);

            await expectEquivalentConnectors([connector1, connector2]);
          });

          test('connected', async () => {
            const [[, connector1], [, connector2]] =
              await getPooledTestSyncletsAndConnectors(createTestConnector, 2);

            await connector1.setAtomForTest('A');
            await expectEquivalentConnectors([connector1, connector2]);

            await connector2.setAtomForTest('B');
            await expectEquivalentConnectors([connector1, connector2]);
          });

          test('connected, deletion', async () => {
            const [[, connector1], [, connector2]] =
              await getPooledTestSyncletsAndConnectors(createTestConnector, 2);

            await connector1.setAtomForTest('A');
            await expectEquivalentConnectors([connector1, connector2]);

            const meta = await connector1.getMeta();
            await connector1.delAtomForTest();
            await expectEquivalentConnectors([connector1, connector2]);
            expect(meta).not.toEqual(await connector1.getMeta());
          });

          test('start 1, set 1, start 2', async () => {
            const [[synclet1, connector1], [synclet2, connector2]] =
              await getPooledTestSyncletsAndConnectors(
                createTestConnector,
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
                createTestConnector,
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
                createTestConnector,
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
                createTestConnector,
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
                createTestConnector,
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
              await getPooledTestSyncletsAndConnectors(createTestConnector, 2);

            await connector1.setAtomForTest('A');
            await connector2.setNearAtomForTest('B');

            await expectEquivalentConnectors([connector1, connector2]);
          });

          test('connected, far atom', async () => {
            if (farAddress) {
              const [[, connector1], [, connector2]] =
                await getPooledTestSyncletsAndConnectors(
                  createTestConnector,
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
                createTestConnector,
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
                  createTestConnector,
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
                createTestConnector,
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
                  createTestConnector,
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
                createTestConnector,
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
              createTestConnector,
              count,
            );

            for (const [i, connector] of connectors.entries()) {
              await connector.setAtomForTest('A' + (i + 1));
              await expectEquivalentConnectors(connectors);
            }
          });

          test('ring', async () => {
            const connectors = await getChainedTestConnectors(
              createTestConnector,
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
  });

export const pause = async (ms = 2) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getPooledTestSyncletsAndConnectors = async <
  TestConnector extends Connector,
>(
  createConnector: () => Promise<TestConnector>,
  number: number,
  start = true,
  log = false,
): Promise<[Synclet, TestConnector][]> => {
  const poolId = getUniqueId();
  return await Promise.all(
    new Array(number)
      .fill(0)
      .map((_, i) =>
        getPooledTestSyncletAndConnector(
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
  TestConnector extends Connector,
>(
  createConnector: (options?: ConnectorOptions) => Promise<TestConnector>,
  id: string = getUniqueId(),
  poolId: string = getUniqueId(),
  start = true,
  log = false,
): Promise<[Synclet, TestConnector]> => {
  const logger = log ? console : undefined;
  const connector = await createConnector({logger});
  const transport = await createMemoryTransport({poolId, logger});
  const synclet = await createSynclet(connector, transport, {}, {id, logger});
  if (start) {
    await synclet.start();
  }
  return [synclet, connector];
};

export const getChainedTestConnectors = async <TestConnector extends Connector>(
  createConnector: (options?: ConnectorOptions) => Promise<TestConnector>,
  number: number,
  loop = false,
  start = true,
  log = false,
): Promise<TestConnector[]> => {
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
      const synclet = await createSynclet(
        connector,
        transports,
        {},
        {id: 'synclet' + (i + 1), logger},
      );
      if (start) {
        await synclet.start();
      }
      return connector;
    }),
  );
};

export const expectEquivalentConnectors = async (
  connectors: TestConnector[],
) => {
  const data = await connectors[0].getData();
  const meta = await connectors[0].getMeta();
  expect(data).toMatchSnapshot('equivalent');
  await Promise.all(
    connectors.map(async (connector) => {
      expect(await connector.getData()).toEqual(data);
      expect(await connector.getMeta()).toEqual(meta);
      expect(await connector.getUnderlyingMetaForTest()).toEqual(meta);
    }),
  );
};

export const expectDifferingConnectors = async (
  connector1: TestConnector,
  connector2: TestConnector,
) => {
  const data1 = await connector1.getData();
  const data2 = await connector2.getData();
  expect(data1).not.toEqual(data2);
  expect([data1, data2]).toMatchSnapshot('differing');
  expect(await connector1.getMeta()).not.toEqual(await connector2.getMeta());
};
