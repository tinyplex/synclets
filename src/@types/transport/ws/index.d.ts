/// transport/ws
import type {WebSocketServer, WebSocket as WsWebSocket} from 'ws';

import type {Transport, TransportOptions} from '../../index.js';

/// WebSocketTypes
export type WebSocketTypes = WebSocket | WsWebSocket;

/// WsClientTransport
export interface WsClientTransport<WebSocketType extends WebSocketTypes>
  extends Transport {
  /// WsClientTransport.getWebSocket
  getWebSocket(): WebSocketType;
}

/// createWsClientTransport
export function createWsClientTransport<WebSocketType extends WebSocketTypes>(
  webSocket: WebSocketType,
  options?: TransportOptions,
): WsClientTransport<WebSocketType>;

/// WsServerTransport
export interface WsServerTransport extends Transport {
  /// WsServerTransport.getWebSocketServer
  getWebSocketServer(): WebSocketServer;
}

/// createWsServerTransport
export function createWsServerTransport(
  webSocketServer: WebSocketServer,
  options?: TransportOptions,
): WsServerTransport;

/// WsServer
export interface WsServer {
  /// WsServer.getWebSocketServer
  getWebSocketServer(): WebSocketServer;

  /// WsServer.destroy
  destroy(): void;
}

/// createWsServer
export function createWsServer(webSocketServer: WebSocketServer): WsServer;
