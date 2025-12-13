/// memory

import type {
  DataConnector,
  DataConnectorOptions,
  MetaConnector,
  MetaConnectorOptions,
  Synclet,
  SyncletImplementations,
  SyncletOptions,
  Transport,
  TransportOptions,
} from '../index.d.ts';

/// createMemoryDataConnector
export function createMemoryDataConnector<Depth extends number>(
  options: DataConnectorOptions<Depth>,
): DataConnector<Depth>;

/// createMemoryMetaConnector
export function createMemoryMetaConnector<Depth extends number>(
  options: MetaConnectorOptions<Depth>,
): MetaConnector<Depth>;

/// MemorySyncletOptions
export type MemorySyncletOptions<Depth extends number> =
  DataConnectorOptions<Depth> &
    MetaConnectorOptions<Depth> & {
      /// MemorySyncletOptions.transport
      transport?: Transport | Transport[];

      /// MemorySyncletOptions.implementations
      implementations?: SyncletImplementations<Depth>;
    } & SyncletOptions;

/// createMemorySynclet
export function createMemorySynclet<Depth extends number>(
  options: MemorySyncletOptions<Depth>,
): Promise<Synclet<Depth, DataConnector<Depth>, MetaConnector<Depth>>>;

/// createMemoryTransport
export function createMemoryTransport(
  options?: TransportOptions & {poolId?: string},
): Transport;
