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
  path?: string | null;
  brokerPaths?: RegExp;
};

/// createWsBrokerTransport
export function createWsBrokerTransport(
  webSocketServer: WebSocketServer,
  options?: WsBrokerTransportOptions & TransportOptions,
): WsBrokerTransport;

/// WsPureBroker
export interface WsPureBroker {
  /// WsPureBroker.getWebSocketServer
  getWebSocketServer(): WebSocketServer;

  /// WsPureBroker.destroy
  destroy(): Promise<void>;
}

/// createWsPureBroker
export function createWsPureBroker(
  webSocketServer: WebSocketServer,
  brokerPaths?: RegExp,
): Promise<WsPureBroker>;
