import type {PGlite} from '@electric-sql/pglite';
import type {
  createPgliteMetaConnector as createPgliteMetaConnectorDecl,
  DatabaseMetaOptions,
  PgliteMetaConnector,
} from '@synclets/@types/connector/pglite';
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
