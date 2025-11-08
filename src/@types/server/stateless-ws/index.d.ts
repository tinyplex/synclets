/// server/stateless-ws

import type {WebSocketServer} from 'ws';

/// StatelessWsServer
export interface StatelessWsServer {
  getWebSocketServer(): WebSocketServer;
  destroy(): Promise<void>;
}

/// createStatelessWsServer
export function createStatelessWsServer(
  webSocketServer: WebSocketServer,
): StatelessWsServer;
