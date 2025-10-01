/// connector/memory

import type {DataConnector, MetaConnector} from '../../index.d.ts';

export function createMemoryDataConnector<Depth extends number>(
  depth: Depth,
): Promise<DataConnector<Depth>>;

export function createMemoryMetaConnector<Depth extends number>(
  depth: Depth,
): Promise<MetaConnector<Depth>>;
