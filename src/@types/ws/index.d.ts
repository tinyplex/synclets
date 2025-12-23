/// ws
import type {WebSocketServer, WebSocket as WsWebSocket} from 'ws';

import type {Transport, TransportOptions} from '../index.d.ts';

/// WebSocketTypes
export type WebSocketTypes = WebSocket | WsWebSocket;

/// WsClientTransport
export interface WsClientTransport<
  WebSocketType extends WebSocketTypes,
> extends Transport {
  /// WsClientTransport.getWebSocket
  getWebSocket(): WebSocketType;
}

/// WsClientTransportOptions
export type WsClientTransportOptions<WebSocketType extends WebSocketTypes> = {
  /// WsClientTransportOptions.webSocket
  readonly webSocket: WebSocketType;
} & TransportOptions;

/// createWsClientTransport
export function createWsClientTransport<WebSocketType extends WebSocketTypes>(
  options: WsClientTransportOptions<WebSocketType>,
): WsClientTransport<WebSocketType>;

/// WsBrokerTransport
export interface WsBrokerTransport extends Transport {
  /// WsBrokerTransport.getWebSocketServer
  getWebSocketServer(): WebSocketServer;
}

/// WsBrokerTransportOptions
export type WsBrokerTransportOptions = {
  /// WsBrokerTransportOptions.webSocketServer
  readonly webSocketServer: WebSocketServer;

  /// WsBrokerTransportOptions.path
  readonly path?: string | null;

  /// WsBrokerTransportOptions.brokerPaths
  readonly brokerPaths?: RegExp;
} & TransportOptions;

/// createWsBrokerTransport
export function createWsBrokerTransport(
  options: WsBrokerTransportOptions,
): WsBrokerTransport;
