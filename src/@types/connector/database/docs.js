/**
 * The connector/database module defines shared option types for SQL-style
 * connectors.
 * @packageDocumentation
 * @module connector/database
 * @since v0.0.0
 */
/// connector/database

/**
 * The Sql type represents a parameterized SQL query.
 *
 * This type encapsulates both the SQL query string and its parameter values,
 * providing safe parameterized query construction that prevents SQL injection.
 * It is used internally by database connectors (PGlite, SQLite3) to build
 * queries dynamically.
 * @category Type
 * @since v0.0.0
 */
/// Sql

/**
 * The getQuery function constructs a string and args pair for retrieving data.
 *
 * This utility function extracts the SQL query string and parameter values
 * from a Sql object, formatting them for execution by the underlying database
 * driver. It is used internally by database connectors to execute parameterized
 * queries.
 * @param sql The Sql object to extract from.
 * @returns A tuple of [queryString, parameters].
 * @category Function
 * @since v0.0.0
 */
/// getQuery

/**
 * The sql template tag constructs a Sql object from a template string.
 *
 * This template literal tag function provides a convenient syntax for building
 * parameterized SQL queries. It automatically handles parameter substitution
 * and escaping, preventing SQL injection vulnerabilities.
 *
 * Example: sql`SELECT * FROM ${table} WHERE id = ${id}`.
 *
 * This is used internally by database connectors for safe query
 * construction.
 * @category Function
 * @since v0.0.0
 */
/// sql

/**
 * The DatabaseDataOptions type configures the table and column names used for
 * data storage in a database.
 *
 * These options allow you to customize the database schema used by database
 * connectors (PGlite, SQLite3) for storing Atom data. You can specify custom
 * table and column names to match existing schemas or naming conventions.
 *
 * If not provided, connectors use sensible defaults (typically 'data' for the
 * table name and standard column names for address parts and values).
 * @category Option
 * @since v0.0.0
 */
/// DatabaseDataOptions

/**
 * The DatabaseMetaOptions type configures the table and column names used for
 * metadata storage in a database.
 *
 * These options allow you to customize the database schema used by database
 * connectors (PGlite, SQLite3) for storing Timestamp metadata. You can specify
 * custom table and column names to match existing schemas or naming
 * conventions.
 *
 * If not provided, connectors use sensible defaults (typically 'meta' for the
 * table name and standard column names for address parts and timestamps).
 * @category Option
 * @since v0.0.0
 */
/// DatabaseMetaOptions
