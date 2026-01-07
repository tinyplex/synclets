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
   * The getClientIds method returns the list of client IDs currently connected
   * to this broker.
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
 *
 * It is important to note that a single WsBrokerTransport instance will route
 * messages between all WebSocket clients connected to it, regardless of the
 * path used to connect. To isolate clients on different paths, create separate
 * WebSocketServer instances (with `noServer: true`) and use the HTTP server's
 * `upgrade` event handler to route connections to the appropriate
 * WebSocketServer based on the request path.
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

/**
 * The getWebSocketServerUpgradeHandler function creates an HTTP upgrade event
 * handler that routes WebSocket connections to the appropriate WebSocketServer
 * based on the incoming request.
 *
 * This utility simplifies the boilerplate needed to route WebSocket upgrade
 * requests on an HTTP server to different WebSocketServer instances. It's
 * particularly useful when you need to isolate clients on different paths to
 * separate broker instances.
 *
 * The handler will destroy the socket if no WebSocketServer is returned for the
 * request.
 * @param getServer A function that receives the incoming HTTP request and
 * returns the appropriate WebSocketServer instance, or undefined if the request
 * should be rejected.
 * @returns An upgrade event handler that can be attached to an HTTP server with
 * `httpServer.on('upgrade', handler)`.
 * @example
 * ```typescript
 * import {createServer} from 'http';
 * import {WebSocketServer} from 'ws';
 * import {getWebSocketServerUpgradeHandler} from 'synclets/ws';
 *
 * const httpServer = createServer();
 * const wss1 = new WebSocketServer({noServer: true});
 * const wss2 = new WebSocketServer({noServer: true});
 *
 * httpServer.on('upgrade', getWebSocketServerUpgradeHandler((request) => {
 *   const pathname = new URL(request.url!, 'http://localhost').pathname;
 *   if (pathname === '/room1') {
 *     return wss1;
 *   }
 *   if (pathname === '/room2') {
 *     return wss2;
 *   }
 *   return undefined; // Reject other paths
 * }));
 * ```
 * @category Transport
 * @since v0.0.0
 */
/// getWebSocketServerUpgradeHandler
