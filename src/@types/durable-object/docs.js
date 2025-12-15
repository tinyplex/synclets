/**
 * The durable-object module provides transport layer integration for Cloudflare
 * Durable Objects.
 * @packageDocumentation
 * @module durable-object
 * @since v0.0.0
 */
/// durable-object

/**
 * The DurableObjectSqliteDataConnectorOptions type describes the options for
 * creating a data connector that uses Cloudflare Durable Object's built-in
 * SQLite storage.
 * @example
 * ```typescript
 * const dataConnector = createDurableObjectSqliteDataConnector({
 *   depth: 3,
 *   sqlStorage: this.ctx.storage.sql,
 *   dataTable: 'data',
 *   addressColumn: 'address',
 *   atomColumn: 'atom',
 * });
 * ```
 * @category Type
 * @since v0.0.6
 */
/// DurableObjectSqliteDataConnectorOptions
{
  /**
   * The SqlStorage instance from the Durable Object storage context.
   * @category Property
   * @since v0.0.6
   */
  /// DurableObjectSqliteDataConnectorOptions.sqlStorage
}

/**
 * The DurableObjectSqliteDataConnector type represents a data connector that
 * uses Cloudflare Durable Object's built-in SQLite storage.
 * @category Type
 * @since v0.0.6
 */
/// DurableObjectSqliteDataConnector
{
  /**
   * Gets the SqlStorage instance.
   * @category Method
   * @since v0.0.6
   */
  /// DurableObjectSqliteDataConnector.getSqlStorage
}

/**
 * The createDurableObjectSqliteDataConnector function creates a data connector
 * that uses Cloudflare Durable Object's built-in SQLite storage.
 *
 * The connector automatically creates tables and indexes as needed. Data is
 * persisted automatically across the Durable Object's lifecycle.
 * @param options - The connector options.
 * @returns A data connector.
 * @example
 * ```typescript
 * class MySyncletDurableObject extends SyncletDurableObject {
 *   getCreateComponents() {
 *     return {
 *       dataConnector: createDurableObjectSqliteDataConnector({
 *         depth: 3,
 *         sqlStorage: this.ctx.storage.sql,
 *       }),
 *     };
 *   }
 * }
 * ```
 * @category Function
 * @since v0.0.6
 */
/// createDurableObjectSqliteDataConnector

/**
 * The DurableObjectSqliteMetaConnectorOptions type describes the options for
 * creating a meta connector that uses Cloudflare Durable Object's built-in
 * SQLite storage.
 * @example
 * ```typescript
 * const metaConnector = createDurableObjectSqliteMetaConnector({
 *   depth: 3,
 *   sqlStorage: this.ctx.storage.sql,
 *   metaTable: 'meta',
 *   addressColumn: 'address',
 *   timestampColumn: 'timestamp',
 * });
 * ```
 * @category Type
 * @since v0.0.6
 */
/// DurableObjectSqliteMetaConnectorOptions
{
  /**
   * The SqlStorage instance from the Durable Object storage context.
   * @category Property
   * @since v0.0.6
   */
  /// DurableObjectSqliteMetaConnectorOptions.sqlStorage
}

/**
 * The DurableObjectSqliteMetaConnector type represents a meta connector that
 * uses Cloudflare Durable Object's built-in SQLite storage.
 * @category Type
 * @since v0.0.6
 */
/// DurableObjectSqliteMetaConnector
{
  /**
   * Gets the SqlStorage instance.
   * @category Method
   * @since v0.0.6
   */
  /// DurableObjectSqliteMetaConnector.getSqlStorage
}

/**
 * The createDurableObjectSqliteMetaConnector function creates a meta connector
 * that uses Cloudflare Durable Object's built-in SQLite storage.
 *
 * The connector automatically creates tables and indexes as needed. Metadata is
 * persisted automatically across the Durable Object's lifecycle.
 * @param options - The connector options.
 * @returns A meta connector.
 * @example
 * ```typescript
 * class MySyncletDurableObject extends SyncletDurableObject {
 *   getCreateComponents() {
 *     return {
 *       metaConnector: createDurableObjectSqliteMetaConnector({
 *         depth: 3,
 *         sqlStorage: this.ctx.storage.sql,
 *       }),
 *     };
 *   }
 * }
 * ```
 * @category Function
 * @since v0.0.6
 */
/// createDurableObjectSqliteMetaConnector

/**
 * The SyncletDurableObject class is an abstract base class for creating
 * Synclet-powered Durable Objects.
 *
 * Extend this class and optionally implement the `createDataConnector` and
 * `createMetaConnector` methods to define how your Durable Object stores data
 * and metadata. The class automatically manages the Synclet lifecycle
 * internally - you don't need to initialize or access the synclet directly.
 *
 * Optionally implement `getSyncletImplementations` or `getSyncletOptions` to
 * configure custom implementations or other options.
 * @example
 * ```typescript
 * class MySyncletDurableObject extends SyncletDurableObject {
 *   createDataConnector() {
 *     return createMemoryDataConnector({depth: 3});
 *   }
 *   createMetaConnector() {
 *     return createMemoryMetaConnector({depth: 3});
 *   }
 *   getSyncletOptions() {
 *     return {logLevel: 'debug'};
 *   }
 * }
 * ```
 * @category Class
 * @since v0.0.0
 */
/// SyncletDurableObject
{
  /**
   * The constructor initializes the Durable Object.
   * @param ctx - The DurableObjectState from Cloudflare.
   * @param env - The environment bindings.
   * @category Constructor
   * @since v0.0.0
   */
  /// SyncletDurableObject.constructor
  /**
   * The getCreateComponents method can optionally be implemented to provide
   * components for creating the Synclet, including data and meta connectors.
   * @returns A SyncletComponents object.
   * @category Creation
   * @since v0.0.0
   */
  /// SyncletDurableObject.getCreateComponents
  /**
   * The getCreateImplementations method can optionally be implemented to
   * provide custom implementations for Synclet lifecycle hooks, conflict
   * resolution, and other behaviors.
   * @returns A SyncletImplementations object with custom implementations.
   * @category Creation
   * @since v0.0.0
   */
  /// SyncletDurableObject.getCreateImplementations
  /**
   * The getCreateOptions method can optionally be implemented to provide
   * additional options for the Synclet, such as logging configuration.
   * @returns A SyncletOptions object with additional configuration.
   * @category Creation
   * @since v0.0.0
   */
  /// SyncletDurableObject.getCreateOptions
  /**
   * The fetch method handles incoming requests to the Durable Object. The
   * Synclet is automatically initialized on first request if not already
   * initialized. Override this method to implement custom request handling.
   * @param request The incoming HTTP request.
   * @returns A Promise resolving to an HTTP response.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// SyncletDurableObject.fetch
  /**
   * The log method logs a message at the specified level.
   * @param message The message to log.
   * @param level The log level (default: 'info').
   * @category Logging
   * @since v0.0.0
   */
  /// SyncletDurableObject.log
  /**
   * The start method starts the Synclet and begins synchronization.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// SyncletDurableObject.start
  /**
   * The stop method stops the Synclet and pauses synchronization.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// SyncletDurableObject.stop
  /**
   * The isStarted method returns whether the Synclet is currently started.
   * @returns True if started, false otherwise.
   * @category Accessor
   * @since v0.0.0
   */
  /// SyncletDurableObject.isStarted
  /**
   * The destroy method destroys the Synclet and cleans up resources.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// SyncletDurableObject.destroy
  /**
   * The getDataConnector method returns the data connector.
   * @returns The DataConnector instance or undefined.
   * @category Accessor
   * @since v0.0.0
   */
  /// SyncletDurableObject.getDataConnector
  /**
   * The getMetaConnector method returns the meta connector.
   * @returns The MetaConnector instance or undefined.
   * @category Accessor
   * @since v0.0.0
   */
  /// SyncletDurableObject.getMetaConnector
  /**
   * The getTransport method returns the transport instances.
   * @returns An array of Transport instances.
   * @category Accessor
   * @since v0.0.0
   */
  /// SyncletDurableObject.getTransport
  /**
   * The sync method triggers synchronization at the specified address.
   * @param address The address to synchronize.
   * @category Sync
   * @since v0.0.0
   */
  /// SyncletDurableObject.sync
  /**
   * The setAtom method sets an atom value at the specified address.
   * @param address The address of the atom.
   * @param atom The atom value to set.
   * @param context Optional context for the operation.
   * @param sync Whether to trigger synchronization (default: true).
   * @category Data
   * @since v0.0.0
   */
  /// SyncletDurableObject.setAtom
  /**
   * The delAtom method deletes an atom at the specified address.
   * @param address The address of the atom to delete.
   * @param context Optional context for the operation.
   * @param sync Whether to trigger synchronization (default: true).
   * @category Data
   * @since v0.0.0
   */
  /// SyncletDurableObject.delAtom
  /**
   * The getData method returns a readonly view of all data.
   * @returns A Promise resolving to the data tree.
   * @category Data
   * @since v0.0.0
   */
  /// SyncletDurableObject.getData
  /**
   * The getMeta method returns a readonly view of all metadata.
   * @returns A Promise resolving to the metadata tree.
   * @category Data
   * @since v0.0.0
   */
  /// SyncletDurableObject.getMeta
}

/**
 * The PureBrokerDurableObject class is a convenience class for creating
 * stateless Synclet-powered Durable Objects that act as brokers for multiple
 * WebSocket clients.
 * @category Class
 * @since v0.0.0
 */
/// PureBrokerDurableObject

/**
 * The getSyncletDurableObjectFetch function returns a convenient handler for a
 * Cloudflare worker to route requests to the fetch handler of a
 * SyncletDurableObject for the given namespace.
 *
 * The implementation of the function that this returns requires the request to
 * be a WebSocket 'Upgrade' request, and for the client to have provided a
 * `sec-websocket-key` header that the server can use as a unique key for the
 * client.
 *
 * It then takes the path of the HTTP request and routes the upgrade request to
 * a Durable Object (in the given namespace) for that path. From then on, the
 * Durable Object handles all the WebSocket communication.
 *
 * Note that you'll need to have a Wrangler configuration that connects your
 * Durable Object class to the namespace. In other words, you'll have something
 * like this in your `wrangler.toml` file.
 *
 * ```toml
 * [[durable_objects.bindings]]
 * name = "MyDurableObjects"
 * class_name = "MyDurableObject"
 * ```
 *
 * Note that it is not required to use this handler to route client requests in
 * your Cloudflare app. If you have your own custom routing logic, path scheme,
 * or authentication, for example, you can easily implement that in the worker's
 * fetch method yourself. See the [Durable Objects
 * documentation](https://developers.cloudflare.com/durable-objects/best-practices/create-durable-object-stubs-and-send-requests/#invoking-the-fetch-handler)
 * for examples.
 *
 * You can also pass a newly created request to the Durable Object's `fetch`
 * method. For example, you can overwrite the 'path' that the Durable Object
 * thinks it is serving, perhaps to inject a unique authenticated user Id that
 * wasn't actually provided by the client WebSocket.
 * @param namespace A string for the namespace of the Durable Objects that you
 * want this worker to route requests to.
 * @returns A fetch handler that routes WebSocket upgrade requests to a Durable
 * Object.
 * @category Creation
 * @since v0.0.0
 */
/// getSyncletDurableObjectFetch

/**
 * The getTableSchema function retrieves the schema of a table
 * from a Cloudflare Durable Object SQL Storage, returning an object mapping
 * column names to their data types.
 *
 * This utility function provides a standardized way to inspect table
 * structure across different database connectors, with consistent output
 * format regardless of the underlying database engine.
 * @param sqlStorage The Durable Object SQL Storage instance.
 * @param table The name of the table to inspect.
 * @returns A Promise that resolves to an object mapping column names to
 * types.
 * @category Utility
 * @since v0.0.7
 */
/// getTableSchema
