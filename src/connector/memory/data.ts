import type {DataConnector} from '@synclets/@types';
import type {createMemoryDataConnector as createMemoryDataConnectorDecl} from '@synclets/@types/connector/memory';
import {createMemoryConnector} from '../../common/memory.ts';

export const createMemoryDataConnector: typeof createMemoryDataConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
): DataConnector<Depth> => createMemoryConnector(false, depth);
