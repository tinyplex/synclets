/**
 * The connector/database/pglite module documents connectors backed by the
 * embedded PGlite database.
 * @packageDocumentation
 * @module connector/database/pglite
 * @since v0.0.0
 */
/// connector/database/pglite

/**
 * The PgliteDataConnector interface describes a DataConnector that wraps a
 * PGlite instance.
 * @category Connector
 * @since v0.0.0
 */
/// PgliteDataConnector
{
  /**
   * The getPglite method returns the underlying PGlite instance.
   * @category Accessor
   * @since v0.0.0
   */
  /// PgliteDataConnector.getPglite
}

/**
 * The createPgliteDataConnector function creates a PgliteDataConnector with
 * optional table settings.
 * @category Connector
 * @since v0.0.0
 */
/// createPgliteDataConnector

/**
 * The PgliteMetaConnector interface describes a MetaConnector that wraps a
 * PGlite instance.
 * @category Connector
 * @since v0.0.0
 */
/// PgliteMetaConnector
{
  /**
   * The getPglite method returns the underlying PGlite instance.
   * @category Accessor
   * @since v0.0.0
   */
  /// PgliteMetaConnector.getPglite
}

/**
 * The createPgliteMetaConnector function creates a PgliteMetaConnector with
 * optional table settings.
 * @category Connector
 * @since v0.0.0
 */
/// createPgliteMetaConnector

/**
 * The PgliteConnectorsOptions type specifies configuration for both data and
 * meta connectors when using createPgliteConnectors.
 * @category Connector
 * @since v0.0.5
 */
/// PgliteConnectorsOptions
{
  /**
   * The dataTable property specifies the table name for data storage.
   * @category Option
   * @since v0.0.5
   */
  /// PgliteConnectorsOptions.dataTable
  /**
   * The metaTable property specifies the table name for metadata storage.
   * @category Option
   * @since v0.0.5
   */
  /// PgliteConnectorsOptions.metaTable
  /**
   * The addressColumn property specifies the column name for addresses.
   * @category Option
   * @since v0.0.5
   */
  /// PgliteConnectorsOptions.addressColumn
  /**
   * The atomColumn property specifies the column name for atom values.
   * @category Option
   * @since v0.0.5
   */
  /// PgliteConnectorsOptions.atomColumn
  /**
   * The timestampColumn property specifies the column name for timestamps.
   * @category Option
   * @since v0.0.5
   */
  /// PgliteConnectorsOptions.timestampColumn
}

/**
 * The createPgliteConnectors function creates both PGlite-backed DataConnector
 * and MetaConnector together for convenience.
 * @param depth The depth of the synclet.
 * @param pglite The PGlite database instance.
 * @param options Configuration for both connectors.
 * @category Connector
 * @since v0.0.5
 */
/// createPgliteConnectors
