/// transport/ws
import type {WebSocket as WsWebSocket} from 'ws';

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
