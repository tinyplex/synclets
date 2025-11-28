import type {DataConnector, MetaConnector} from '@synclets/@types';
import type {
  createMemoryConnectors as createMemoryConnectorsDecl,
  createMemoryDataConnector as createMemoryDataConnectorDecl,
  createMemoryMetaConnector as createMemoryMetaConnectorDecl,
} from '@synclets/@types/connector/memory';
import {createMemoryConnector} from '../../common/memory.ts';

export const createMemoryConnectors: typeof createMemoryConnectorsDecl = <
  Depth extends number,
>(
  depth: Depth,
) => {
  const dataConnector = createMemoryDataConnector(depth);
  const metaConnector = createMemoryMetaConnector(depth);
  return {
    getDataConnector: () => dataConnector,
    getMetaConnector: () => metaConnector,
  };
};

export const createMemoryDataConnector: typeof createMemoryDataConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
): DataConnector<Depth> => createMemoryConnector(false, depth);

export const createMemoryMetaConnector: typeof createMemoryMetaConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
): MetaConnector<Depth> => createMemoryConnector(true, depth);
