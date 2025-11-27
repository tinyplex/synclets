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
 * The createSqlite3DataConnector function creates a Sqlite3DataConnector with
 * optional table mapping.
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
 * The createSqlite3MetaConnector function creates a Sqlite3MetaConnector with
 * optional table mapping.
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
 * The createSqlite3Connectors function creates both SQLite3-backed
 * DataConnector and MetaConnector together for convenience.
 * @param depth The depth of the synclet.
 * @param database The SQLite3 database instance.
 * @param options Configuration for both connectors.
 * @category Connector
 * @since v0.0.5
 */
/// createSqlite3Connectors
