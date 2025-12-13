/**
 * The tinybase module describes the adapters that wrap TinyBase
 * stores as connectors.
 * @packageDocumentation
 * @module tinybase
 * @since v0.0.0
 */
/// tinybase

/**
 * The TinyBaseDataConnector interface describes a DataConnector that wraps a
 * TinyBase Store.
 * @category Connector
 * @since v0.0.0
 */
/// TinyBaseDataConnector
{
  /**
   * The getStore method returns the wrapped TinyBase Store.
   * @category Accessor
   * @since v0.0.0
   */
  /// TinyBaseDataConnector.getStore
}

/**
 * The TinyBaseDataConnectorOptions type describes the configuration options for
 * creating a TinyBase-backed DataConnector.
 * @category Type
 * @since v0.0.0
 */
/// TinyBaseDataConnectorOptions
{
  /**
   * The store property specifies the TinyBase Store to wrap.
   * @category Option
   * @since v0.0.0
   */
  /// TinyBaseDataConnectorOptions.store
}

/**
 * The createTinyBaseDataConnector function creates a TinyBaseDataConnector from
 * an existing Store.
 *
 * This connector bridges TinyBase Stores with the Synclet API, allowing you to
 * use an existing TinyBase Store as the backing storage for a Synclet's data.
 * The connector maps Synclet atom operations to TinyBase's hierarchical
 * table/row/cell structure.
 *
 * This is useful when you want to leverage TinyBase's reactive queries,
 * indexing, and other features alongside Synclet synchronization. The Store can
 * be in-memory or persisted using TinyBase's own Persister implementations.
 *
 * Note that this creates only a DataConnector. You will need a separate
 * MetaConnector (typically using a different storage backend) to store
 * timestamp metadata.
 * @param options Configuration options for the TinyBase data connector.
 * @returns A TinyBaseDataConnector that uses the Store for storage.
 * @category Connector
 * @since v0.0.0
 */
/// createTinyBaseDataConnector
