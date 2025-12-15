/**
 * The sqlite3 module describes connectors that persist data
 * in sqlite3.
 * @packageDocumentation
 * @module sqlite3
 * @since v0.0.0
 */
/// sqlite3

/**
 * The Sqlite3DataConnector interface describes a DataConnector that wraps a
 * sqlite3 Database.
 * @category Connector
 * @since v0.0.0
 */
/// Sqlite3DataConnector
{
  /**
   * The getDatabase method returns the wrapped sqlite3 Database instance.
   * @category Accessor
   * @since v0.0.0
   */
  /// Sqlite3DataConnector.getDatabase
}

/**
 * The Sqlite3DataConnectorOptions type specifies configuration for a SQLite3
 * DataConnector.
 * @category Connector
 * @since v0.0.0
 */
/// Sqlite3DataConnectorOptions
{
  /**
   * The database property specifies the SQLite3 Database instance.
   * @category Option
   * @since v0.0.0
   */
  /// Sqlite3DataConnectorOptions.database
}

/**
 * The createSqlite3DataConnector function creates a DataConnector that persists
 * Atom data in a SQLite3 database table.
 *
 * The connector automatically creates the necessary table and index structures
 * on first use. By default, data is stored in a table named 'data' with columns
 * for 'address' and 'atom', but these can be customized via the options
 * parameter.
 *
 * This connector requires the 'sqlite3' npm package and is designed for Node.js
 * environments. For browser-compatible SQLite, consider using PGlite instead.
 * @category Connector
 * @since v0.0.0
 */
/// createSqlite3DataConnector

/**
 * The Sqlite3MetaConnector interface describes a MetaConnector that wraps a
 * sqlite3 Database.
 * @category Connector
 * @since v0.0.0
 */
/// Sqlite3MetaConnector
{
  /**
   * The getDatabase method returns the wrapped sqlite3 Database instance.
   * @category Accessor
   * @since v0.0.0
   */
  /// Sqlite3MetaConnector.getDatabase
}

/**
 * The Sqlite3MetaConnectorOptions type specifies configuration for a SQLite3
 * MetaConnector.
 * @category Connector
 * @since v0.0.0
 */
/// Sqlite3MetaConnectorOptions
{
  /**
   * The database property specifies the SQLite3 Database instance.
   * @category Option
   * @since v0.0.0
   */
  /// Sqlite3MetaConnectorOptions.database
}

/**
 * The createSqlite3MetaConnector function creates a MetaConnector that persists
 * Timestamp metadata in a SQLite3 database table.
 *
 * The connector automatically creates the necessary table and index structures
 * on first use. By default, metadata is stored in a table named 'meta' with
 * columns for 'address' and 'timestamp', but these can be customized via the
 * options parameter. The metadata table mirrors the structure of the data tree
 * but stores HLC timestamps instead of Atom values.
 * @category Connector
 * @since v0.0.0
 */
/// createSqlite3MetaConnector

/**
 * The Sqlite3SyncletOptions type specifies configuration for creating a SQLite3
 * Synclet.
 * @category Connector
 * @since v0.0.0
 */
/// Sqlite3SyncletOptions
{
  /**
   * The transport property specifies the Transport or Transports to use.
   * @category Option
   * @since v0.0.0
   */
  /// Sqlite3SyncletOptions.transport
  /**
   * The implementations property specifies custom Synclet implementations.
   * @category Option
   * @since v0.0.0
   */
  /// Sqlite3SyncletOptions.implementations
}

/**
 * The Sqlite3Synclet interface represents a Synclet with SQLite3-backed data
 * and metadata connectors.
 * @category Connector
 * @since v0.0.0
 */
/// Sqlite3Synclet

/**
 * The createSqlite3Synclet function creates a Synclet with SQLite3-backed
 * connectors.
 *
 * This is the recommended approach for creating a SQLite3 Synclet, providing a
 * simplified API that creates both the DataConnector and MetaConnector
 * internally. The function uses the same SQLite3 database instance for both
 * connectors and allows customization of all table and column names.
 *
 * When table/column options are not provided, the connectors use defaults:
 * data table 'data' with columns 'address' and 'atom', and meta table 'meta'
 * with columns 'address' and 'timestamp'. All table structures are created
 * automatically on first use.
 * @param options Configuration including depth, database instance, and optional
 * table/column names.
 * @returns A Promise that resolves to the Synclet.
 * @category Connector
 * @since v0.0.0
 */
/// createSqlite3Synclet

/**
 * The getTableSchema function retrieves the schema of a table from a
 * SQLite3 database, returning an object mapping column names to their data
 * types.
 *
 * This utility function provides a standardized way to inspect table
 * structure across different database connectors, with consistent output
 * format regardless of the underlying database engine.
 * @param database The SQLite3 database instance.
 * @param table The name of the table to inspect.
 * @returns A Promise that resolves to an object mapping column names to
 * types.
 * @category Utility
 * @since v0.0.7
 */
/// sqlite3.getTableSchema
