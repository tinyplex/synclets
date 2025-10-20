import type {DataConnector} from '@synclets/@types';
import type {createMemoryDataConnector as createMemoryDataConnectorDecl} from '@synclets/@types/connector/memory';
import {createMemoryDataConnector as createMemoryDataConnectorImpl} from '../../common/memory.ts';

export const createMemoryDataConnector: typeof createMemoryDataConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
): DataConnector<Depth> => createMemoryDataConnectorImpl(depth);
