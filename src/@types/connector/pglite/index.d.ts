/// connector/pglite

import type {PGlite} from '@electric-sql/pglite';
import type {MetaConnector} from '../../index.d.ts';

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
