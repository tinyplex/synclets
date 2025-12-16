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

/// createWsClientTransport
export function createWsClientTransport<WebSocketType extends WebSocketTypes>(
  webSocket: WebSocketType,
  options?: TransportOptions,
): WsClientTransport<WebSocketType>;

/// WsBrokerTransport
export interface WsBrokerTransport extends Transport {
  /// WsBrokerTransport.getWebSocketServer
  getWebSocketServer(): WebSocketServer;
}

/// WsBrokerTransportOptions
export type WsBrokerTransportOptions = {
  /// WsBrokerTransportOptions.path
  readonly path?: string | null;

  /// WsBrokerTransportOptions.brokerPaths
  readonly brokerPaths?: RegExp;
};

/// createWsBrokerTransport
export function createWsBrokerTransport(
  webSocketServer: WebSocketServer,
  options?: WsBrokerTransportOptions & TransportOptions,
): WsBrokerTransport;

/// WsBrokerOnly
export interface WsBrokerOnly {
  /// WsBrokerOnly.getWebSocketServer
  getWebSocketServer(): WebSocketServer;

  /// WsBrokerOnly.destroy
  destroy(): Promise<void>;
}

/// createWsBrokerOnly
export function createWsBrokerOnly(
  webSocketServer: WebSocketServer,
  brokerPaths?: RegExp,
): Promise<WsBrokerOnly>;
