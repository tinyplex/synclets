/// connector/memory

import type {DataConnector, MetaConnector} from '../../index.d.ts';

/// createMemoryDataConnector
export function createMemoryDataConnector<Depth extends number>(
  depth: Depth,
): DataConnector<Depth>;

/// createMemoryMetaConnector
export function createMemoryMetaConnector<Depth extends number>(
  depth: Depth,
): MetaConnector<Depth>;
