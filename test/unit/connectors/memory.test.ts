import {Synclet} from 'synclets';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/connector/memory';
import {describeConnectorTests} from '../common.ts';

describeConnectorTests(
  'memory',
  <Depth extends number>(depth: Depth) => createMemoryDataConnector(depth),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector(depth),
  (synclet: Synclet<number>) => synclet.getMeta(),
);
