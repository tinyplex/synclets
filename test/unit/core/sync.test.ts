import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
  createMemoryTransport,
} from 'synclets/memory';
import {describeCommonConnectorTests} from '../common.ts';

describeCommonConnectorTests(
  async () => {},
  async () => {},
  <Depth extends number>(depth: Depth) => createMemoryDataConnector({depth}),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector({depth}),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);
