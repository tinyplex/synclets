/// server/stateless-ws

import type {WebSocketServer} from 'ws';

export interface StatelessWsServer {
  getWebSocketServer(): WebSocketServer;
  destroy(): Promise<void>;
}

export function createStatelessWsServer(
  webSocketServer: WebSocketServer,
): StatelessWsServer;
