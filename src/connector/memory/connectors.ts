import type {createMemoryConnectors as createMemoryConnectorsDecl} from '@synclets/@types/connector/memory';
import {createMemoryDataConnector} from './data.ts';
import {createMemoryMetaConnector} from './meta.ts';

export const createMemoryConnectors: typeof createMemoryConnectorsDecl = <
  Depth extends number,
>(
  depth: Depth,
) => [createMemoryDataConnector(depth), createMemoryMetaConnector(depth)];
