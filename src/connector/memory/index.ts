import type {DataConnector, MetaConnector} from '@synclets/@types';
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
): Promise<DataConnector> => createMemoryDataConnectorImpl(depth);

export const createMemoryMetaConnector: typeof createMemoryMetaConnectorDecl = (
  depth,
): Promise<MetaConnector> => createMemoryMetaConnectorImpl(depth);
