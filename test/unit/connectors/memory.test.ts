import {ConnectorOptions, Synclet} from 'synclets';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/connector/memory';
import {describeConnectorTests} from '../common.ts';

describeConnectorTests(
  'memory',
  (depth: number, options: ConnectorOptions) =>
    createMemoryDataConnector(depth, options),
  (depth: number, options: ConnectorOptions) =>
    createMemoryMetaConnector(depth, options),
  (synclet: Synclet) => synclet.getMeta(),
);
