import type {Connector, ConnectorOptions} from '@synclets/@types';
import type {createMemoryConnector as createMemoryConnectorDecl} from '@synclets/@types/connector/memory';
import {createMemoryConnector as createMemoryConnectorImpl} from '../../common/memory.ts';

export const createMemoryConnector: typeof createMemoryConnectorDecl = (
  depth,
  options?: ConnectorOptions,
): Promise<Connector> => createMemoryConnectorImpl(depth, options);
