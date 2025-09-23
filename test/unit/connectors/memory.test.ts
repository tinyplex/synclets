import {Connector, ConnectorOptions} from 'synclets';
import {createMemoryConnector} from 'synclets/connector/memory';
import {describeConnectorTests} from '../common.ts';

describeConnectorTests(
  'memory',
  (depth: number, options: ConnectorOptions) =>
    createMemoryConnector(depth, options),
  async (connector: Connector) => connector.getMeta(),
);
