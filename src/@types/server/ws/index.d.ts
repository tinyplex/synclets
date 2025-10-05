/// server-ws

import type {WebSocketServer} from 'ws';

export interface WsServer {
  getWebSocketServer(): WebSocketServer;
  destroy(): Promise<void>;
}

export function createWsServer(webSocketServer: WebSocketServer): WsServer;
