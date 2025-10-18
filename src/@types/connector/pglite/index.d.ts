/// connector/pglite

import type {PGlite} from '@electric-sql/pglite';
import type {MetaConnector} from '../../index.d.ts';

export interface PgliteMetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  getPglite(): PGlite;
}

export function createPgliteMetaConnector<Depth extends number>(
  depth: Depth,
  pglite: PGlite,
  table: string,
): PgliteMetaConnector<Depth>;
