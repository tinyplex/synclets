/**
 * The ws module documents WebSocket-based transports and servers for
 * browser and Node runtimes.
 * @packageDocumentation
 * @module ws
 * @since v0.0.0
 */
/// ws

/**
 * The WebSocketTypes type unifies browser WebSocket and ws WebSocket
 * implementations.
 * @category Transport
 * @since v0.0.0
 */
/// WebSocketTypes

/**
 * The WsClientTransport interface describes a Transport that proxies an
 * existing WebSocket.
 * @category Transport
 * @since v0.0.0
 */
/// WsClientTransport
{
  /**
   * The getWebSocket method returns the wrapped WebSocket instance.
   * @category Accessor
   * @since v0.0.0
   */
  /// WsClientTransport.getWebSocket
}

/**
 * The createWsClientTransport function wraps a WebSocket in a WsClientTransport
 * implementation.
 *
 * This transport enables real-time synchronization over network connections,
 * allowing Synclets to communicate across different machines, processes, or
 * browser tabs. It handles automatic reconnection, packet fragmentation for
 * large payloads, and bidirectional communication.
 *
 * The client transport can only connect to servers created with createWsBroker
 * (or another Synclet running WsBrokerTransport). It is suitable for browser
 * environments (using the Web API WebSocket) and Node.js (using the 'ws'
 * package).
 * @param webSocket The WebSocket instance to wrap (browser WebSocket or ws
 * WebSocket).
 * @param options Optional TransportOptions for configuring the transport.
 * @returns A WsClientTransport instance for WebSocket communication.
 * @category Transport
 * @since v0.0.0
 */
/// createWsClientTransport

/**
 * The WsBrokerTransportOptions type describes additional configuration for a
 * WsBrokerTransport.
 * @category Transport
 * @since v0.0.0
 */
/// WsBrokerTransportOptions

/**
 * The WsBrokerTransport interface describes a Transport that creates a
 * broker for both this synclet and others that connect over WebSockets.
 * @category Transport
 * @since v0.0.0
 */
/// WsBrokerTransport
{
  /**
   * The getWebSocketServer method returns the wrapped WebSocketServer instance.
   * @category Accessor
   * @since v0.0.0
   */
  /// WsBrokerTransport.getWebSocketServer
}

/**
 * The createWsBrokerTransport function wraps a WebSocketServer in a
 * WsBrokerTransport implementation.
 *
 * This transport enables a Synclet running on a server to communicate with
 * multiple client Synclets over WebSocket connections. It handles packet
 * fragmentation, connection management, and bidirectional communication with
 * all connected clients.
 *
 * This transport is only available in Node.js environments. It automatically
 * broadcasts packets to all connected clients.
 * @param webSocketServer The WebSocketServer instance to wrap.
 * @param options Optional TransportOptions for configuring the transport.
 * @returns A WsBrokerTransport instance for server-side WebSocket
 * communication.
 * @category Transport
 * @since v0.0.0
 */
/// createWsBrokerTransport

/**
 * The WsBroker interface describes the minimal API for a stateless WebSocket
 * server wrapper.
 *
 * It is a convenience interface representing a Synclet with no connectors of
 * its own, but with a WsBrokerTransport to handle and broker multiple client
 * connections.
 * @category Broker
 * @since v0.0.0
 */
/// WsBroker
{
  /**
   * The getWebSocketServer method returns the wrapped WebSocketServer instance.
   * @category Accessor
   * @since v0.0.0
   */
  /// WsBroker.getWebSocketServer
  /**
   * The destroy method shuts down the WebSocketServer and releases resources.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// WsBroker.destroy
}

/**
 * The createWsBroker function wraps a WebSocketServer to expose the WsBroker
 * interface.
 *
 * This server acts as the central connection point for multiple client Synclets
 * to communicate with a server-side Synclet. It manages WebSocket connections,
 * handles client authentication, and routes packets between the server Synclet
 * and connected clients.
 *
 * This function is a convenience wrapper, basically creating a Synclet with
 * only a WsBrokerTransport and no connections. If you would like your server to
 * also have its own connectors to store server data, you should create a
 * Synclet yourself with those connectors and add a WsBrokerTransport to it.
 *
 * The server requires the 'ws' package and is only available in Node.js
 * environments.
 * @param webSocketServer The WebSocketServer instance to wrap.
 * @returns A WsBroker instance.
 * @category Broker
 * @since v0.0.0
 */
/// createWsBroker
