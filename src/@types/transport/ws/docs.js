/**
 * The transport/ws module documents WebSocket-based transports and servers for
 * browser and Node runtimes.
 * @packageDocumentation
 * @module transport/ws
 * @since v0.0.0
 */
/// transport/ws

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
 * The client transport can only connect to servers created with createWsServer.
 * It is suitable for browser environments (using the Web API WebSocket) and
 * Node.js (using the 'ws' package).
 * @param webSocket The WebSocket instance to wrap (browser WebSocket or ws
 * WebSocket).
 * @param options Optional TransportOptions for configuring the transport.
 * @returns A WsClientTransport instance for WebSocket communication.
 * @category Transport
 * @since v0.0.0
 */
/// createWsClientTransport

/**
 * The WsServerTransport interface describes a Transport that proxies an
 * existing WebSocket.
 * @category Transport
 * @since v0.0.0
 */
/// WsServerTransport
{
  /**
   * The getWebSocketServer method returns the wrapped WebSocketServer instance.
   * @category Accessor
   * @since v0.0.0
   */
  /// WsServerTransport.getWebSocketServer
}

/**
 * The createWsServerTransport function wraps a WebSocketServer in a
 * WsServerTransport implementation.
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
 * @returns A WsServerTransport instance for server-side WebSocket
 * communication.
 * @category Transport
 * @since v0.0.0
 */
/// createWsServerTransport

/**
 * The WsServer interface describes the minimal API for a stateless WebSocket
 * server wrapper.
 * @category Server
 * @since v0.0.0
 */
/// WsServer
{
  /**
   * The getWebSocketServer method returns the wrapped WebSocketServer instance.
   * @category Accessor
   * @since v0.0.0
   */
  /// WsServer.getWebSocketServer
  /**
   * The destroy method shuts down the WebSocketServer and releases resources.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// WsServer.destroy
}

/**
 * The createWsServer function wraps a WebSocketServer to expose the WsServer
 * interface.
 *
 * This server acts as the central connection point for multiple client Synclets
 * to communicate with a server-side Synclet. It manages WebSocket connections,
 * handles client authentication, and routes packets between the server Synclet
 * and connected clients.
 *
 * The server requires the 'ws' package and is only available in Node.js
 * environments.
 * @param webSocketServer The WebSocketServer instance to wrap.
 * @returns A WsServer instance that can be used with createWsServerTransport.
 * @category Server
 * @since v0.0.0
 */
/// createWsServer
