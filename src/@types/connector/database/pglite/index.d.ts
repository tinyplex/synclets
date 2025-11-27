/// connector/database/pglite

import type {PGlite} from '@electric-sql/pglite';
import type {
  Connectors,
  DataConnector,
  MetaConnector,
} from '../../../index.d.ts';
import type {DatabaseDataOptions, DatabaseMetaOptions} from '../index.d.ts';

export type {Connectors};

/// PgliteDataConnector
export interface PgliteDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  /// PgliteDataConnector.getPglite
  getPglite(): PGlite;
}

/// createPgliteDataConnector
export function createPgliteDataConnector<Depth extends number>(
  depth: Depth,
  pglite: PGlite,
  options?: DatabaseDataOptions,
): PgliteDataConnector<Depth>;

/// PgliteMetaConnector
export interface PgliteMetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  /// PgliteMetaConnector.getPglite
  getPglite(): PGlite;
}

/// createPgliteMetaConnector
export function createPgliteMetaConnector<Depth extends number>(
  depth: Depth,
  pglite: PGlite,
  options?: DatabaseMetaOptions,
): PgliteMetaConnector<Depth>;

/// PgliteConnectorsOptions
export type PgliteConnectorsOptions = {
  /// PgliteConnectorsOptions.dataTable
  dataTable?: string;

  /// PgliteConnectorsOptions.metaTable
  metaTable?: string;

  /// PgliteConnectorsOptions.addressColumn
  addressColumn?: string;

  /// PgliteConnectorsOptions.atomColumn
  atomColumn?: string;

  /// PgliteConnectorsOptions.timestampColumn
  timestampColumn?: string;
};

/// createPgliteConnectors
export function createPgliteConnectors<Depth extends number>(
  depth: Depth,
  pglite: PGlite,
  options?: PgliteConnectorsOptions,
): Connectors<Depth, PgliteDataConnector<Depth>, PgliteMetaConnector<Depth>>;
