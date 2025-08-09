import {Connector, createSynclet, Synclet} from 'synclets';
import {createMemoryTransport} from 'synclets/transport/memory';
import {getUniqueId} from 'synclets/utils';

export const pause = async (ms = 2) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getTestSyncletsAndConnectors = <TestConnector extends Connector>(
  createConnector: () => TestConnector,
  number: number,
  log = false,
): [Synclet, TestConnector][] => {
  const poolId = getUniqueId();
  return new Array(number)
    .fill(0)
    .map((_, i) =>
      getTestSyncletAndConnector(createConnector, i + 1 + '', poolId, log),
    );
};

export const getTestSyncletAndConnector = <TestConnector extends Connector>(
  createConnector: () => TestConnector,
  id?: string,
  poolId: string = getUniqueId(),
  log = false,
): [Synclet, TestConnector] => {
  const logger = log ? console : undefined;
  const connector = createConnector();
  const synclet = createSynclet(
    connector,
    createMemoryTransport({poolId, logger}),
    {id, logger},
  );
  return [synclet, connector];
};
