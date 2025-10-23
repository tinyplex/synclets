import type {MetaConnector} from '@synclets/@types';
import type {createMemoryMetaConnector as createMemoryMetaConnectorDecl} from '@synclets/@types/connector/memory';
import {createMemoryConnector} from '../../common/memory.ts';

export const createMemoryMetaConnector: typeof createMemoryMetaConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
): MetaConnector<Depth> => createMemoryConnector(true, depth);
