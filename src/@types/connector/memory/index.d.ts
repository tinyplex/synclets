/// connector/memory

import type {
  DataConnector,
  MetaConnector,
  Synclet,
  SyncletImplementations,
  SyncletOptions,
  Transport,
} from '../../index.d.ts';

/// MemoryDataConnectorOptions
export type MemoryDataConnectorOptions<Depth extends number> = {
  /// MemoryDataConnectorOptions.depth
  depth: Depth;
};

/// createMemoryDataConnector
export function createMemoryDataConnector<Depth extends number>(
  options: MemoryDataConnectorOptions<Depth>,
): DataConnector<Depth>;

/// MemoryMetaConnectorOptions
export type MemoryMetaConnectorOptions<Depth extends number> = {
  /// MemoryMetaConnectorOptions.depth
  depth: Depth;
};

/// createMemoryMetaConnector
export function createMemoryMetaConnector<Depth extends number>(
  options: MemoryMetaConnectorOptions<Depth>,
): MetaConnector<Depth>;

/// MemorySyncletOptions
export type MemorySyncletOptions<Depth extends number> =
  MemoryDataConnectorOptions<Depth> &
    MemoryMetaConnectorOptions<Depth> & {
      /// MemorySyncletOptions.transport
      transport?: Transport | Transport[];

      /// MemorySyncletOptions.implementations
      implementations?: SyncletImplementations<Depth>;
    } & SyncletOptions;

/// createMemorySynclet
export function createMemorySynclet<Depth extends number>(
  options: MemorySyncletOptions<Depth>,
): Promise<Synclet<Depth, DataConnector<Depth>, MetaConnector<Depth>>>;
