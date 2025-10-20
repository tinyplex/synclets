import type {PGlite} from '@electric-sql/pglite';
import type {
  createPgliteDataConnector as createPgliteDataConnectorDecl,
  DatabaseDataOptions,
  PgliteDataConnector,
} from '@synclets/@types/connector/pglite';
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
