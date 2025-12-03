/// connector/database/pglite

import type {PGlite} from '@electric-sql/pglite';
import type {
  DataConnector,
  MetaConnector,
  Synclet,
  SyncletImplementations,
  SyncletOptions,
  Transport,
} from '../../../index.d.ts';

/// PgliteDataConnector
export interface PgliteDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  /// PgliteDataConnector.getPglite
  getPglite(): PGlite;
}

/// PgliteDataConnectorOptions
export type PgliteDataConnectorOptions<Depth extends number> = {
  /// PgliteDataConnectorOptions.depth
  depth: Depth;

  /// PgliteDataConnectorOptions.pglite
  pglite: PGlite;

  /// PgliteDataConnectorOptions.dataTable
  dataTable?: string;

  /// PgliteDataConnectorOptions.addressColumn
  addressColumn?: string;

  /// PgliteDataConnectorOptions.atomColumn
  atomColumn?: string;
};

/// createPgliteDataConnector
export function createPgliteDataConnector<Depth extends number>(
  options: PgliteDataConnectorOptions<Depth>,
): PgliteDataConnector<Depth>;

/// PgliteMetaConnector
export interface PgliteMetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  /// PgliteMetaConnector.getPglite
  getPglite(): PGlite;
}

/// PgliteMetaConnectorOptions
export type PgliteMetaConnectorOptions<Depth extends number> = {
  /// PgliteMetaConnectorOptions.depth
  depth: Depth;

  /// PgliteMetaConnectorOptions.pglite
  pglite: PGlite;

  /// PgliteMetaConnectorOptions.metaTable
  metaTable?: string;

  /// PgliteMetaConnectorOptions.addressColumn
  addressColumn?: string;

  /// PgliteMetaConnectorOptions.timestampColumn
  timestampColumn?: string;
};

/// createPgliteMetaConnector
export function createPgliteMetaConnector<Depth extends number>(
  options: PgliteMetaConnectorOptions<Depth>,
): PgliteMetaConnector<Depth>;

/// PgliteSyncletOptions
export type PgliteSyncletOptions<Depth extends number> =
  PgliteDataConnectorOptions<Depth> &
    PgliteMetaConnectorOptions<Depth> & {
      /// PgliteSyncletOptions.transport
      transport?: Transport | Transport[];

      /// PgliteSyncletOptions.implementations
      implementations?: SyncletImplementations<Depth>;
    } & SyncletOptions;

/// createPgliteSynclet
export function createPgliteSynclet<Depth extends number>(
  options: PgliteSyncletOptions<Depth>,
): Promise<
  Synclet<Depth, PgliteDataConnector<Depth>, PgliteMetaConnector<Depth>>
>;
