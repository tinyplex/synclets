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
): DataConnector<Depth> => createMemoryDataConnectorImpl(depth);

export const createMemoryMetaConnector: typeof createMemoryMetaConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
): MetaConnector<Depth> => createMemoryMetaConnectorImpl(depth);
