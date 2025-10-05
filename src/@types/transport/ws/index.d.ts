/// transport/ws
import type {WebSocket as WsWebSocket} from 'ws';

import type {Transport, TransportOptions} from '../../index.js';

export type WebSocketTypes = WebSocket | WsWebSocket;

export interface WsTransport<WebSocketType extends WebSocketTypes>
  extends Transport {
  getWebSocket(): WebSocketType;
}

export function createWsTransport<WebSocketType extends WebSocketTypes>(
  webSocket: WebSocketType,
  options?: TransportOptions,
): Promise<WsTransport<WebSocketType>>;
