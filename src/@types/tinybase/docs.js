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

/**
 * The TinyBaseSyncletOptions type specifies configuration for creating a
 * TinyBase Synclet.
 * @category Connector
 * @since v0.0.0
 */
/// TinyBaseSyncletOptions
{
  /**
   * The transport property specifies the Transport or Transports to use.
   * @category Option
   * @since v0.0.0
   */
  /// TinyBaseSyncletOptions.transport
  /**
   * The implementations property specifies custom Synclet implementations.
   * @category Option
   * @since v0.0.0
   */
  /// TinyBaseSyncletOptions.implementations
}

/**
 * The TinyBaseSynclet type represents a Synclet with a TinyBase Store-backed
 * data connector and an in-memory metadata connector.
 * @category Connector
 * @since v0.0.0
 */
/// TinyBaseSynclet

/**
 * The createTinyBaseSynclet function creates a Synclet with a TinyBase Store
 * for data storage and in-memory metadata storage.
 *
 * This is the recommended approach for creating a TinyBase-based Synclet,
 * providing a simplified API that creates both the TinyBaseDataConnector and
 * an in-memory MetaConnector internally. The TinyBase Store handles the data
 * tree while timestamps are kept in memory.
 *
 * This combination is ideal when you want to use TinyBase's features (reactive
 * queries, indexes, persistence options) for data while keeping metadata
 * lightweight. For fully persistent metadata, consider creating connectors
 * manually and using a persistent MetaConnector.
 * @param options Configuration including the TinyBase Store, transport, and
 * other Synclet options.
 * @returns A Promise that resolves to the configured Synclet instance.
 * @category Connector
 * @since v0.0.0
 */
/// createTinyBaseSynclet
