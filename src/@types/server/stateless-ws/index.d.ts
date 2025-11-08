/// server/stateless-ws

import type {WebSocketServer} from 'ws';

/// StatelessWsServer
export interface StatelessWsServer {
  /// StatelessWsServer.getWebSocketServer
  getWebSocketServer(): WebSocketServer;

  /// StatelessWsServer.destroy
  destroy(): Promise<void>;
}

/// createStatelessWsServer
export function createStatelessWsServer(
  webSocketServer: WebSocketServer,
): StatelessWsServer;
