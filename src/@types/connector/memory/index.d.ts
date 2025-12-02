/// connector/memory

import type {Connectors, DataConnector, MetaConnector} from '../../index.d.ts';

/// createMemoryDataConnector
export function createMemoryDataConnector<Depth extends number>(
  depth: Depth,
): DataConnector<Depth>;

/// createMemoryMetaConnector
export function createMemoryMetaConnector<Depth extends number>(
  depth: Depth,
): MetaConnector<Depth>;

/// createMemoryConnectors
export function createMemoryConnectors<Depth extends number>(
  depth: Depth,
): Connectors<Depth, DataConnector<Depth>, MetaConnector<Depth>>;
