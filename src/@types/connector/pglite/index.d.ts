/// connector/pglite

import type {PGlite} from '@electric-sql/pglite';
import type {DataConnector, MetaConnector} from '../../index.d.ts';

/// DatabaseDataOptions
export type DatabaseDataOptions = {
  table?: string;
  addressColumn?: string;
  atomColumn?: string;
};

/// PgliteDataConnector
export interface PgliteDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  getPglite(): PGlite;
}

/// createPgliteDataConnector
export function createPgliteDataConnector<Depth extends number>(
  depth: Depth,
  pglite: PGlite,
  options?: DatabaseDataOptions,
): PgliteDataConnector<Depth>;

/// DatabaseMetaOptions
export type DatabaseMetaOptions = {
  table?: string;
  addressColumn?: string;
  timestampColumn?: string;
};

/// PgliteMetaConnector
export interface PgliteMetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  getPglite(): PGlite;
}

/// createPgliteMetaConnector
export function createPgliteMetaConnector<Depth extends number>(
  depth: Depth,
  pglite: PGlite,
  options?: DatabaseMetaOptions,
): PgliteMetaConnector<Depth>;
