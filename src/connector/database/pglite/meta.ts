import type {PGlite} from '@electric-sql/pglite';
import type {DatabaseMetaOptions} from '@synclets/@types/connector/database';
import type {
  createPgliteMetaConnector as createPgliteMetaConnectorDecl,
  PgliteMetaConnector,
} from '@synclets/@types/connector/database/pglite';
import {createPgliteConnector} from './common.ts';

export const createPgliteMetaConnector: typeof createPgliteMetaConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
  pglite: PGlite,
  {
    table = 'meta',
    addressColumn = 'address',
    timestampColumn = 'timestamp',
  }: DatabaseMetaOptions = {},
): PgliteMetaConnector<Depth> =>
  createPgliteConnector(true, depth, pglite, {
    table,
    addressColumn,
    leafColumn: timestampColumn,
  });
