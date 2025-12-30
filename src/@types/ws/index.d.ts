/// ws
import type {WebSocketServer, WebSocket as WsWebSocket} from 'ws';

import type {Transport, TransportOptions} from '../index.d.ts';

/// WebSocketTypes
export type WebSocketTypes = WebSocket | WsWebSocket;

/// WsBrokerTransport
export interface WsBrokerTransport extends Transport {
  /// WsBrokerTransport.getWebSocketServer
  getWebSocketServer(): WebSocketServer;
  /// WsBrokerTransport.getPaths
  getPaths(): string[];
  /// WsBrokerTransport.getClientIds
  getClientIds(path: string): string[];
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
