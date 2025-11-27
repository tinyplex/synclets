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
 * The createPgliteDataConnector function creates a DataConnector that persists
 * Atom data in a PGlite database table.
 *
 * The connector automatically creates the necessary table and index structures
 * on first use. By default, data is stored in a table named 'data' with columns
 * for 'address' and 'atom', but these can be customized via the options
 * parameter.
 *
 * PGlite is an embedded PostgreSQL database that runs in-process (similar to
 * SQLite), making it ideal for local-first applications in Node.js or browser
 * environments with WASM.
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
 * The createPgliteMetaConnector function creates a MetaConnector that persists
 * Timestamp metadata in a PGlite database table.
 *
 * The connector automatically creates the necessary table and index structures
 * on first use. By default, metadata is stored in a table named 'meta' with
 * columns for 'address' and 'timestamp', but these can be customized via the
 * options parameter. The metadata table mirrors the structure of the data tree
 * but stores HLC timestamps instead of Atom values.
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
 * The createPgliteConnectors function creates both a PGlite-backed
 * DataConnector and MetaConnector together in a single call, returning them as
 * a tuple.
 *
 * This is the recommended approach when both data and metadata are stored in
 * the same PGlite database instance. The function provides a simplified API
 * compared to creating the connectors separately, while still allowing
 * customization of table and column names for both connectors.
 *
 * When options are not provided, the connectors use default table names 'data'
 * and 'meta' with standard column names. All table structures are created
 * automatically on first use.
 * @param depth The tree depth the Synclet will operate at.
 * @param pglite The PGlite database instance to use for both connectors.
 * @param options Optional configuration for table and column names.
 * @returns A tuple of [DataConnector, MetaConnector].
 * @category Connector
 * @since v0.0.5
 */
/// createPgliteConnectors
