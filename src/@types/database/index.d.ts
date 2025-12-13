/// database

import type {
  DataConnectorOptions,
  MetaConnectorOptions,
} from '../index.d.ts';

/// Sql
export type Sql = {__brand: 'Sql'; strings: string[]; args: any[]};

/// sql
export function sql(
  templateStrings: TemplateStringsArray,
  ...expressions: any[]
): Sql;

/// getQuery
export function getQuery(sql: Sql): [string: string, args: any[]];

/// DatabaseDataConnectorOptions
export type DatabaseDataConnectorOptions<Depth extends number> = {
  dataTable?: string;
  addressColumn?: string;
  atomColumn?: string;
} & DataConnectorOptions<Depth>;

/// DatabaseMetaConnectorOptions
export type DatabaseMetaConnectorOptions<Depth extends number> = {
  metaTable?: string;
  addressColumn?: string;
  timestampColumn?: string;
} & MetaConnectorOptions<Depth>;
