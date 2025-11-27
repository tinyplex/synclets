import type {PGlite} from '@electric-sql/pglite';
import type {
  DatabaseDataOptions,
  DatabaseMetaOptions,
} from '@synclets/@types/connector/database';
import type {createPgliteConnectors as createPgliteConnectorsDecl} from '@synclets/@types/connector/database/pglite';
import {createPgliteDataConnector} from './data.ts';
import {createPgliteMetaConnector} from './meta.ts';

export const createPgliteConnectors: typeof createPgliteConnectorsDecl = <
  Depth extends number,
>(
  depth: Depth,
  pglite: PGlite,
  {
    dataTable = 'data',
    metaTable = 'meta',
    addressColumn = 'address',
    atomColumn = 'atom',
    timestampColumn = 'timestamp',
  }: {
    dataTable?: string;
    metaTable?: string;
    addressColumn?: string;
    atomColumn?: string;
    timestampColumn?: string;
  } = {},
) => [
  createPgliteDataConnector(depth, pglite, {
    table: dataTable,
    addressColumn,
    atomColumn,
  } as DatabaseDataOptions),
  createPgliteMetaConnector(depth, pglite, {
    table: metaTable,
    addressColumn,
    timestampColumn,
  } as DatabaseMetaOptions),
];
