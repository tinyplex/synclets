import {Connector, ConnectorOptions} from 'synclets';
import {createMemoryConnector} from 'synclets/connector/memory';
import {testConnector} from './common.ts';

testConnector(
  'memory',
  (atomDepth: number, options: ConnectorOptions) =>
    createMemoryConnector(atomDepth, options),
  async (connector: Connector) => connector.getMeta(),
);
