/**
 * The server/stateless-ws module defines the minimal stateless WebSocket server
 * wrapper types.
 * @packageDocumentation
 * @module server/stateless-ws
 * @since v0.0.0
 */
/// server/stateless-ws

/**
 * The StatelessWsServer interface describes the minimal API for a stateless
 * WebSocket server wrapper.
 * @category Server
 * @since v0.0.0
 */
/// StatelessWsServer
{
  /**
   * The getWebSocketServer method returns the wrapped WebSocketServer instance.
   * @category Accessor
   * @since v0.0.0
   */
  /// StatelessWsServer.getWebSocketServer
  /**
   * The destroy method shuts down the WebSocketServer and releases resources.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// StatelessWsServer.destroy
}

/**
 * The createStatelessWsServer function wraps a WebSocketServer to expose the
 * StatelessWsServer interface.
 * @category Server
 * @since v0.0.0
 */
/// createStatelessWsServer
