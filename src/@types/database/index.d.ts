/// database

import type {DataConnectorOptions, MetaConnectorOptions} from '../index.d.ts';

/// Sql
export type Sql = {__brand: 'Sql'; strings: string[]; args: any[]};

/// sql
export function sql(
  templateStrings: TemplateStringsArray,
  ...expressions: any[]
): Sql;

/// getQuery
export function getQuery(sql: Sql): [string: string, args: any[]];

/// TableSchema
export type TableSchema = {[column: string]: string};

/// DatabaseDataConnectorOptions
export type DatabaseDataConnectorOptions<Depth extends number> = {
  /// DatabaseDataConnectorOptions.dataTable
  readonly dataTable?: string;

  /// DatabaseDataConnectorOptions.addressColumn
  readonly addressColumn?: string;

  /// DatabaseDataConnectorOptions.atomColumn
  readonly atomColumn?: string;
} & DataConnectorOptions<Depth>;

/// DatabaseMetaConnectorOptions
export type DatabaseMetaConnectorOptions<Depth extends number> = {
  /// DatabaseMetaConnectorOptions.metaTable
  readonly metaTable?: string;

  /// DatabaseMetaConnectorOptions.addressColumn
  readonly addressColumn?: string;

  /// DatabaseMetaConnectorOptions.timestampColumn
  readonly timestampColumn?: string;
} & MetaConnectorOptions<Depth>;
