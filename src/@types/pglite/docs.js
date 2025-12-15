/**
 * The pglite module documents connectors backed by the
 * embedded PGlite database.
 * @packageDocumentation
 * @module pglite
 * @since v0.0.0
 */
/// pglite

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
 * The PgliteDataConnectorOptions type specifies configuration for a PGlite
 * DataConnector.
 * @category Connector
 * @since v0.0.0
 */
/// PgliteDataConnectorOptions
{
  /**
   * The pglite property specifies the PGlite database instance.
   * @category Option
   * @since v0.0.0
   */
  /// PgliteDataConnectorOptions.pglite
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
 * The PgliteMetaConnectorOptions type specifies configuration for a PGlite
 * MetaConnector.
 * @category Connector
 * @since v0.0.0
 */
/// PgliteMetaConnectorOptions
{
  /**
   * The pglite property specifies the PGlite database instance.
   * @category Option
   * @since v0.0.0
   */
  /// PgliteMetaConnectorOptions.pglite
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
 * The PgliteSyncletOptions type specifies configuration for creating a PGlite
 * Synclet.
 * @category Connector
 * @since v0.0.0
 */
/// PgliteSyncletOptions
{
  /**
   * The depth property specifies the tree depth.
   * @category Option
   * @since v0.0.0
   */
  /// PgliteSyncletOptions.depth
  /**
   * The pglite property specifies the PGlite database instance.
   * @category Option
   * @since v0.0.0
   */
  /// PgliteSyncletOptions.pglite
  /**
   * The dataTable property specifies the table name for data storage.
   * @category Option
   * @since v0.0.0
   */
  /// PgliteSyncletOptions.dataTable
  /**
   * The metaTable property specifies the table name for metadata storage.
   * @category Option
   * @since v0.0.0
   */
  /// PgliteSyncletOptions.metaTable
  /**
   * The addressColumn property specifies the column name for addresses.
   * @category Option
   * @since v0.0.0
   */
  /// PgliteSyncletOptions.addressColumn
  /**
   * The atomColumn property specifies the column name for atom values.
   * @category Option
   * @since v0.0.0
   */
  /// PgliteSyncletOptions.atomColumn
  /**
   * The timestampColumn property specifies the column name for timestamps.
   * @category Option
   * @since v0.0.0
   */
  /// PgliteSyncletOptions.timestampColumn
  /**
   * The transport property specifies the Transport or Transports to use.
   * @category Option
   * @since v0.0.0
   */
  /// PgliteSyncletOptions.transport
  /**
   * The implementations property specifies custom Synclet implementations.
   * @category Option
   * @since v0.0.0
   */
  /// PgliteSyncletOptions.implementations
}

/**
 * The createPgliteSynclet function creates a Synclet with PGlite-backed
 * connectors.
 *
 * This is the recommended approach for creating a PGlite Synclet, providing a
 * simplified API that creates both the DataConnector and MetaConnector
 * internally. The function uses the same PGlite database instance for both
 * connectors and allows customization of all table and column names.
 *
 * When table/column options are not provided, the connectors use defaults:
 * data table 'data' with columns 'address' and 'atom', and meta table 'meta'
 * with columns 'address' and 'timestamp'. All table structures are created
 * automatically on first use.
 * @param options Configuration including depth, pglite instance, and optional
 * table/column names.
 * @returns A Promise that resolves to the Synclet.
 * @category Connector
 * @since v0.0.0
 */
/// createPgliteSynclet

/**
 * The getTableSchema function retrieves the schema of a table from a
 * PGlite database, returning an object mapping column names to their data
 * types.
 *
 * This utility function provides a standardized way to inspect table
 * structure across different database connectors, with consistent output
 * format regardless of the underlying database engine.
 * @param pglite The PGlite database instance.
 * @param table The name of the table to inspect.
 * @returns A Promise that resolves to an object mapping column names to
 * types.
 * @category Utility
 * @since v0.0.7
 */
/// getTableSchema
