import console from 'console';
import {Connector, ConnectorOptions, createSynclet, Synclet} from 'synclets';
import {createMemoryTransport} from 'synclets/transport/memory';
import {getUniqueId} from 'synclets/utils';

export interface TestConnector extends Connector {
  getDataForTest(): any;
  getMetaForTest(): any;
  getUnderlyingMetaForTest(): Promise<any>;
}

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
      const backwardSynclet =
        i != 0 || loop
          ? await createSynclet(
              connector,
              await createMemoryTransport({poolId: poolId + i, logger}),
              {},
              {id: `synclet${i}B`, logger},
            )
          : undefined;
      const forwardSynclet =
        i != number - 1 || loop
          ? await createSynclet(
              connector,
              await createMemoryTransport({
                poolId: poolId + (i == number - 1 ? 0 : i + 1),
                logger,
              }),
              {},
              {id: `synclet${i}F`, logger},
            )
          : undefined;
      if (start) {
        await backwardSynclet?.start();
        await forwardSynclet?.start();
      }
      return connector;
    }),
  );
};

export const expectEquivalentConnectors = async (
  connectors: TestConnector[],
) => {
  const data = connectors[0].getDataForTest();
  const meta = connectors[0].getMetaForTest();
  expect(data).toMatchSnapshot('equivalent');
  await Promise.all(
    connectors.map(async (connector) => {
      expect(connector.getDataForTest()).toEqual(data);
      expect(connector.getMetaForTest()).toEqual(meta);
      expect(await connector.getUnderlyingMetaForTest()).toEqual(meta);
    }),
  );
};

export const expectDifferingConnectors = async (
  connector1: TestConnector,
  connector2: TestConnector,
) => {
  const data1 = connector1.getDataForTest();
  const data2 = connector2.getDataForTest();
  expect(data1).not.toEqual(data2);
  expect([data1, data2]).toMatchSnapshot('differing');
  expect(connector1.getMetaForTest()).not.toEqual(connector2.getMetaForTest());
};
