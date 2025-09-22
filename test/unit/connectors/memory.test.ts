import {Connector, ConnectorOptions} from 'synclets';
import {createMemoryConnector} from 'synclets/connector/memory';
import {describeConnectorTests} from '../common.ts';

describeConnectorTests(
  'memory',
  (atomDepth: number, options: ConnectorOptions) =>
    createMemoryConnector(atomDepth, options),
  async (connector: Connector) => connector.getMeta(),
);
