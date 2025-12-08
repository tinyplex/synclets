/**
 * The durable-object module provides transport layer integration for Cloudflare
 * Durable Objects.
 * @packageDocumentation
 * @module durable-object
 * @since v0.0.0
 */
/// durable-object

/**
 * The SyncletDurableObject class is a base class for creating Synclet-powered
 * Durable Objects.
 *
 * Extend this class and implement `createDataConnector` and
 * `createMetaConnector` to create a fully functional sync server.
 * @category Class
 * @since v0.0.0
 */
/// SyncletDurableObject
{
  /**
   * The constructor initializes the Durable Object and sets up the synclet.
   * @param ctx - The DurableObjectState from Cloudflare.
   * @param env - The environment bindings.
   * @category Constructor
   * @since v0.0.0
   */
  /// SyncletDurableObject.constructor
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
