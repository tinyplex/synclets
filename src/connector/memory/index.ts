import type {DataConnector, MetaConnector} from '@synclets/@types';
import type {
  createMemoryDataConnector as createMemoryDataConnectorDecl,
  createMemoryMetaConnector as createMemoryMetaConnectorDecl,
} from '@synclets/@types/connector/memory';
import {
  createMemoryDataConnector as createMemoryDataConnectorImpl,
  createMemoryMetaConnector as createMemoryMetaConnectorImpl,
} from '../../common/memory.ts';

export const createMemoryDataConnector: typeof createMemoryDataConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
): Promise<DataConnector<Depth>> => createMemoryDataConnectorImpl(depth);

export const createMemoryMetaConnector: typeof createMemoryMetaConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
): Promise<MetaConnector<Depth>> => createMemoryMetaConnectorImpl(depth);
