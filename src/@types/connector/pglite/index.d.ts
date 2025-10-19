/// connector/pglite

import type {PGlite} from '@electric-sql/pglite';
import type {DataConnector, MetaConnector} from '../../index.d.ts';

export type DatabaseDataOptions = {
  table?: string;
  addressColumn?: string;
  atomColumn?: string;
};

export interface PgliteDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  getPglite(): PGlite;
}

export function createPgliteDataConnector<Depth extends number>(
  depth: Depth,
  pglite: PGlite,
  options?: DatabaseDataOptions,
): PgliteDataConnector<Depth>;

export type DatabaseMetaOptions = {
  table?: string;
  addressColumn?: string;
  timestampColumn?: string;
};

export interface PgliteMetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  getPglite(): PGlite;
}

export function createPgliteMetaConnector<Depth extends number>(
  depth: Depth,
  pglite: PGlite,
  options?: DatabaseMetaOptions,
): PgliteMetaConnector<Depth>;
