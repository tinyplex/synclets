import {Synclet} from 'synclets';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/connector/memory';
import {describeConnectorTests} from '../common.ts';

describeConnectorTests(
  'memory',
  (depth: number) => createMemoryDataConnector(depth),
  (depth: number) => createMemoryMetaConnector(depth),
  (synclet: Synclet) => synclet.getMeta(),
);
