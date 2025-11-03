import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/connector/memory';
import {createMemoryTransport} from 'synclets/transport/memory';
import {describeCommonConnectorTests} from '../common.ts';

describeCommonConnectorTests(
  async () => {},
  async () => {},
  <Depth extends number>(depth: Depth) => createMemoryDataConnector(depth),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector(depth),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);
