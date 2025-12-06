/// database

/// Sql
export type Sql = {__brand: 'Sql'; strings: string[]; args: any[]};

/// sql
export function sql(
  templateStrings: TemplateStringsArray,
  ...expressions: any[]
): Sql;

/// getQuery
export function getQuery(sql: Sql): [string: string, args: any[]];

/// DatabaseDataOptions
export type DatabaseDataOptions = {
  table?: string;
  addressColumn?: string;
  atomColumn?: string;
};

/// DatabaseMetaOptions
export type DatabaseMetaOptions = {
  table?: string;
  addressColumn?: string;
  timestampColumn?: string;
};
