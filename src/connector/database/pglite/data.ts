import type {PGlite} from '@electric-sql/pglite';
import type {DatabaseDataOptions} from '@synclets/@types/connector/database';
import type {
  createPgliteDataConnector as createPgliteDataConnectorDecl,
  PgliteDataConnector,
} from '@synclets/@types/connector/database/pglite';
import {createPgliteConnector} from './common.ts';

export const createPgliteDataConnector: typeof createPgliteDataConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
  pglite: PGlite,
  {
    table = 'data',
    addressColumn = 'address',
    atomColumn = 'atom',
  }: DatabaseDataOptions = {},
): PgliteDataConnector<Depth> =>
  createPgliteConnector(false, depth, pglite, {
    table,
    addressColumn,
    leafColumn: atomColumn,
  });
