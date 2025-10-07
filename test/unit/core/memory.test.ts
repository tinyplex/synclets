import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/connector/memory';
import {createMemoryTransport} from 'synclets/transport/memory';
import {describeSyncletTests} from '../common.ts';

describeSyncletTests(
  'memory over memory',
  async () => {},
  async () => {},
  <Depth extends number>(depth: Depth) => createMemoryDataConnector(depth),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector(depth),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);
