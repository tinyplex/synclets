/// transport/ws
import type {WebSocket as WsWebSocket} from 'ws';

import type {Transport, TransportOptions} from '../../index.js';

/// WebSocketTypes
export type WebSocketTypes = WebSocket | WsWebSocket;

/// WsTransport
export interface WsTransport<WebSocketType extends WebSocketTypes>
  extends Transport {
  getWebSocket(): WebSocketType;
}

/// createWsTransport
export function createWsTransport<WebSocketType extends WebSocketTypes>(
  webSocket: WebSocketType,
  options?: TransportOptions,
): WsTransport<WebSocketType>;
