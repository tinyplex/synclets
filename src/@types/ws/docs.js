/**
 * The ws module documents WebSocket-based transports and servers for browser
 * and Node runtimes.
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
 * The WsBrokerTransportOptions type describes additional configuration for a
 * WsBrokerTransport.
 * @category Transport
 * @since v0.0.0
 */
/// WsBrokerTransportOptions
{
  /**
   * The webSocketServer property specifies the WebSocketServer instance to
   * wrap.
   * @category Option
   * @since v0.0.0
   */
  /// WsBrokerTransportOptions.webSocketServer
  /**
   * The path property specifies the WebSocket path to listen on.
   * @category Option
   * @since v0.0.0
   */
  /// WsBrokerTransportOptions.path
  /**
   * The brokerPaths property specifies a regex pattern for broker path
   * matching.
   * @category Option
   * @since v0.0.0
   */
  /// WsBrokerTransportOptions.brokerPaths
}

/**
 * The WsBrokerTransport interface describes a Transport that creates a broker
 * for both this synclet and others that connect over WebSockets.
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
  /**
   * The getPaths method returns the list of paths currently associated with
   * this transport.
   * @category Accessor
   * @since v0.0.0
   */
  /// WsBrokerTransport.getPaths
  /**
   * The getClientIds method returns the list of client IDs currently connected
   * on the specified path.
   * @category Accessor
   * @since v0.0.0
   */
  /// WsBrokerTransport.getClientIds
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
 * @param options WsBrokerTransportOptions for configuring the transport.
 * @returns A WsBrokerTransport instance for server-side WebSocket
 * communication.
 * @category Transport
 * @since v0.0.0
 */
/// createWsBrokerTransport

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
 * The WsClientTransportOptions type describes configuration for a
 * WsClientTransport.
 * @category Transport
 * @since v0.0.0
 */
/// WsClientTransportOptions
{
  /**
   * The webSocket property specifies the WebSocket instance to wrap.
   * @category Option
   * @since v0.0.0
   */
  /// WsClientTransportOptions.webSocket
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
 * The client transport can only connect to servers created with a 'server'
 * synclet running WsBrokerTransport or similar. It is suitable for browser
 * environments (using the Web API WebSocket) and Node.js (using the 'ws'
 * package).
 * @param options WsClientTransportOptions for configuring the transport.
 * @returns A WsClientTransport instance for WebSocket communication.
 * @category Transport
 * @since v0.0.0
 */
/// createWsClientTransport
