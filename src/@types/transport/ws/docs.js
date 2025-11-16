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
 * The createWsServerTransport function wraps a Server in a WsServerTransport
 * implementation.
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
 * @category Server
 * @since v0.0.0
 */
/// createWsServer
