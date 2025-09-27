import {ConnectorOptions, Synclet} from 'synclets';
import {createMemoryConnector} from 'synclets/connector/memory';
import {describeConnectorTests} from '../common.ts';

describeConnectorTests(
  'memory',
  (depth: number, options: ConnectorOptions) =>
    createMemoryConnector(depth, options),
  (synclet: Synclet) => synclet.getMeta(),
);
