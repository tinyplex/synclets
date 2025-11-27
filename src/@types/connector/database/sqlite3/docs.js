/**
 * The connector/database/sqlite3 module describes connectors that persist data
 * in sqlite3.
 * @packageDocumentation
 * @module connector/database/sqlite3
 * @since v0.0.0
 */
/// connector/database/sqlite3

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
 * The Sqlite3ConnectorsOptions type specifies configuration for both data and
 * meta connectors when using createSqlite3Connectors.
 * @category Connector
 * @since v0.0.5
 */
/// Sqlite3ConnectorsOptions
{
  /**
   * The dataTable property specifies the table name for data storage.
   * @category Option
   * @since v0.0.5
   */
  /// Sqlite3ConnectorsOptions.dataTable
  /**
   * The metaTable property specifies the table name for metadata storage.
   * @category Option
   * @since v0.0.5
   */
  /// Sqlite3ConnectorsOptions.metaTable
  /**
   * The addressColumn property specifies the column name for addresses.
   * @category Option
   * @since v0.0.5
   */
  /// Sqlite3ConnectorsOptions.addressColumn
  /**
   * The atomColumn property specifies the column name for atom values.
   * @category Option
   * @since v0.0.5
   */
  /// Sqlite3ConnectorsOptions.atomColumn
  /**
   * The timestampColumn property specifies the column name for timestamps.
   * @category Option
   * @since v0.0.5
   */
  /// Sqlite3ConnectorsOptions.timestampColumn
}

/**
 * The createSqlite3Connectors function creates both a SQLite3-backed
 * DataConnector and MetaConnector together in a single call, returning them as
 * a tuple.
 *
 * This is the recommended approach when both data and metadata are stored in
 * the same SQLite3 database instance. The function provides a simplified API
 * compared to creating the connectors separately, while still allowing
 * customization of table and column names for both connectors.
 *
 * When options are not provided, the connectors use default table names 'data'
 * and 'meta' with standard column names. All table structures are created
 * automatically on first use.
 * @param depth The tree depth the Synclet will operate at.
 * @param database The SQLite3 Database instance to use for both connectors.
 * @param options Optional configuration for table and column names.
 * @returns A tuple of [DataConnector, MetaConnector].
 * @category Connector
 * @since v0.0.5
 */
/// createSqlite3Connectors
