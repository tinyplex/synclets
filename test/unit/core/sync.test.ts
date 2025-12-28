import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
  createMemoryTransport,
} from 'synclets/memory';
import {describeCommonSyncletTests} from '../common.ts';

describeCommonSyncletTests(
  async () => {},
  async () => {},
  async () => {},
  async () => {},
  <Depth extends number>(depth: Depth) => createMemoryDataConnector({depth}),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector({depth}),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);
