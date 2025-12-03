/**
 * The connector/memory module provides volatile connectors for tests, demos,
 * and ephemeral synclets.
 * @packageDocumentation
 * @module connector/memory
 * @since v0.0.0
 */
/// connector/memory

/**
 * The MemoryDataConnectorOptions type specifies configuration for creating an
 * in-memory DataConnector.
 * @category Connector
 * @since v0.0.5
 */
/// MemoryDataConnectorOptions
{
  /**
   * The depth property specifies the tree depth the connector will operate at.
   * @category Option
   * @since v0.0.5
   */
  /// MemoryDataConnectorOptions.depth
}

/**
 * The createMemoryDataConnector function creates an in-memory DataConnector
 * that stores Atom data in a JavaScript Map.
 *
 * This connector provides fast, volatile storage that exists only during the
 * current process lifetime. Data is lost when the process terminates or the
 * Synclet is destroyed. It is primarily useful for testing, demos, temporary
 * state, or as a fast cache layer in combination with persistent connectors.
 *
 * The connector works in any JavaScript environment (Node.js, browsers, etc.)
 * and has no external dependencies.
 * @category Connector
 * @since v0.0.0
 */
/// createMemoryDataConnector

/**
 * The MemoryMetaConnectorOptions type specifies configuration for creating an
 * in-memory MetaConnector.
 * @category Connector
 * @since v0.0.5
 */
/// MemoryMetaConnectorOptions
{
  /**
   * The depth property specifies the tree depth the connector will operate at.
   * @category Option
   * @since v0.0.5
   */
  /// MemoryMetaConnectorOptions.depth
}

/**
 * The createMemoryMetaConnector function creates an in-memory MetaConnector
 * that stores Timestamp metadata in a JavaScript Map.
 *
 * This connector provides fast, volatile metadata storage that mirrors the data
 * tree structure but contains HLC timestamps for conflict resolution. Like the
 * data connector, it is primarily useful for testing, demos, or temporary
 * state.
 *
 * The connector works in any JavaScript environment and has no external
 * dependencies.
 * @category Connector
 * @since v0.0.0
 */
/// createMemoryMetaConnector

/**
 * The MemorySyncletOptions type specifies configuration for creating an
 * in-memory Synclet.
 * @category Connector
 * @since v0.0.5
 */
/// MemorySyncletOptions
{
  /**
   * The depth property specifies the tree depth the Synclet will operate at.
   * @category Option
   * @since v0.0.5
   */
  /// MemorySyncletOptions.depth
  /**
   * The transport property specifies the Transport instance for
   * synchronization.
   * @category Option
   * @since v0.0.5
   */
  /// MemorySyncletOptions.transport
  /**
   * The implementations property optionally specifies custom conflict
   * resolution implementations.
   * @category Option
   * @since v0.0.5
   */
  /// MemorySyncletOptions.implementations
}

/**
 * The createMemorySynclet function creates an in-memory Synclet with both data
 * and metadata storage in a single call.
 *
 * This is the simplest way to create a fully functional Synclet with no
 * persistence, making it ideal for testing, prototyping, or scenarios where
 * data should not survive process restarts. The function provides a simplified
 * API that creates both the DataConnector and MetaConnector internally, along
 * with the Synclet instance.
 * @param options Configuration object specifying transport and other Synclet
 * options.
 * @returns A Promise resolving to the configured Synclet instance.
 * @category Connector
 * @since v0.0.5
 */
/// createMemorySynclet
