/// pglite

import type {PGlite} from '@electric-sql/pglite';
import type {
  DatabaseDataConnectorOptions,
  DatabaseMetaConnectorOptions,
  TableSchema,
} from '../database/index.d.ts';
import type {
  DataConnector,
  MetaConnector,
  Synclet,
  SyncletImplementations,
  SyncletOptions,
  Transport,
} from '../index.d.ts';

/// PgliteDataConnector
export interface PgliteDataConnector<
  Depth extends number,
> extends DataConnector<Depth> {
  /// PgliteDataConnector.getPglite
  getPglite(): PGlite;
}

/// PgliteDataConnectorOptions
export type PgliteDataConnectorOptions<Depth extends number> = {
  /// PgliteDataConnectorOptions.pglite
  readonly pglite: PGlite;
} & DatabaseDataConnectorOptions<Depth>;

/// createPgliteDataConnector
export function createPgliteDataConnector<const Depth extends number>(
  options: PgliteDataConnectorOptions<Depth>,
): PgliteDataConnector<Depth>;

/// PgliteMetaConnector
export interface PgliteMetaConnector<
  Depth extends number,
> extends MetaConnector<Depth> {
  /// PgliteMetaConnector.getPglite
  getPglite(): PGlite;
}

/// PgliteMetaConnectorOptions
export type PgliteMetaConnectorOptions<Depth extends number> = {
  /// PgliteMetaConnectorOptions.pglite
  readonly pglite: PGlite;
} & DatabaseMetaConnectorOptions<Depth>;

/// createPgliteMetaConnector
export function createPgliteMetaConnector<const Depth extends number>(
  options: PgliteMetaConnectorOptions<Depth>,
): PgliteMetaConnector<Depth>;

/// PgliteSyncletOptions
export type PgliteSyncletOptions<Depth extends number> =
  PgliteDataConnectorOptions<Depth> &
    PgliteMetaConnectorOptions<Depth> & {
      /// PgliteSyncletOptions.transport
      readonly transport?: Transport | Transport[];

      /// PgliteSyncletOptions.implementations
      readonly implementations?: SyncletImplementations<Depth>;
    } & SyncletOptions;

/// PgliteSynclet
export type PgliteSynclet<Depth extends number> = Synclet<
  Depth,
  PgliteDataConnector<Depth>,
  PgliteMetaConnector<Depth>
>;

/// createPgliteSynclet
export function createPgliteSynclet<Depth extends number>(
  options: PgliteSyncletOptions<Depth>,
): Promise<PgliteSynclet<Depth>>;

/// pglite.getTableSchema
export function getTableSchema(
  pglite: PGlite,
  table: string,
): Promise<TableSchema>;
