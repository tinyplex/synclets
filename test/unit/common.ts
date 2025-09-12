import console from 'console';
import {Connector, ConnectorOptions, createSynclet, Synclet} from 'synclets';
import {createMemoryTransport} from 'synclets/transport/memory';
import {getUniqueId} from 'synclets/utils';

export const pause = async (ms = 2) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getTestSyncletsAndConnectors = async <
  TestConnector extends Connector,
>(
  createConnector: () => Promise<TestConnector>,
  number: number,
  log = false,
): Promise<[Synclet, TestConnector][]> => {
  const poolId = getUniqueId();
  return await Promise.all(
    new Array(number)
      .fill(0)
      .map(() => getTestSyncletAndConnector(createConnector, poolId, log)),
  );
};

export const getTestSyncletAndConnector = async <
  TestConnector extends Connector,
>(
  createConnector: (options?: ConnectorOptions) => Promise<TestConnector>,
  poolId: string = getUniqueId(),
  log = false,
): Promise<[Synclet, TestConnector]> => {
  const logger = log ? console : undefined;
  const connector = await createConnector({logger});
  const transport = await createMemoryTransport({poolId, logger});
  const synclet = await createSynclet(connector, transport, {}, {logger});
  return [synclet, connector];
};
