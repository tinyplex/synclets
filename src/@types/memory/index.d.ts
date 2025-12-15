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
export function createMemoryDataConnector<const Depth extends number>(
  options: DataConnectorOptions<Depth>,
): DataConnector<Depth>;

/// createMemoryMetaConnector
export function createMemoryMetaConnector<const Depth extends number>(
  options: MetaConnectorOptions<Depth>,
): MetaConnector<Depth>;

/// MemorySyncletOptions
export type MemorySyncletOptions<Depth extends number> =
  DataConnectorOptions<Depth> &
    MetaConnectorOptions<Depth> & {
      /// MemorySyncletOptions.transport
      readonly transport?: Transport | Transport[];

      /// MemorySyncletOptions.implementations
      readonly implementations?: SyncletImplementations<Depth>;
    } & SyncletOptions;

/// MemorySynclet
export type MemorySynclet<Depth extends number> = Synclet<
  Depth,
  DataConnector<Depth>,
  MetaConnector<Depth>
>;

/// createMemorySynclet
export function createMemorySynclet<Depth extends number>(
  options: MemorySyncletOptions<Depth>,
): Promise<MemorySynclet<Depth>>;

/// MemoryTransportOptions
export type MemoryTransportOptions = {
  /// MemoryTransportOptions.poolId
  readonly poolId?: string;
} & TransportOptions;

/// createMemoryTransport
export function createMemoryTransport(
  options?: MemoryTransportOptions,
): Transport;
