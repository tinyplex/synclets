import type {
  ConnectorOptions,
  DataConnector,
  MetaConnector,
} from '@synclets/@types';
import type {
  createMemoryDataConnector as createMemoryDataConnectorDecl,
  createMemoryMetaConnector as createMemoryMetaConnectorDecl,
} from '@synclets/@types/connector/memory';
import {
  createMemoryDataConnector as createMemoryDataConnectorImpl,
  createMemoryMetaConnector as createMemoryMetaConnectorImpl,
} from '../../common/memory.ts';

export const createMemoryDataConnector: typeof createMemoryDataConnectorDecl = (
  depth,
  options?: ConnectorOptions,
): Promise<DataConnector> => createMemoryDataConnectorImpl(depth, options);

export const createMemoryMetaConnector: typeof createMemoryMetaConnectorDecl = (
  depth,
  options?: ConnectorOptions,
): Promise<MetaConnector> => createMemoryMetaConnectorImpl(depth, options);
