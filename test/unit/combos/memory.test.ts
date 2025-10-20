import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/connector/memory';
import {createStatelessWsServer} from 'synclets/server/stateless-ws';
import {createMemoryTransport} from 'synclets/transport/memory';
import {createWsTransport} from 'synclets/transport/ws';
import {WebSocket, WebSocketServer} from 'ws';
import {describeSyncletTests} from '../common.ts';

const WS_PORT = 9000;

describeSyncletTests(
  'memory',
  async () => {},
  async () => {},
  <Depth extends number>(depth: Depth) => createMemoryDataConnector(depth),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector(depth),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);

describeSyncletTests(
  'ws',
  async () => createStatelessWsServer(new WebSocketServer({port: WS_PORT})),
  async (wsServer) => wsServer.destroy(),
  <Depth extends number>(depth: Depth) => createMemoryDataConnector(depth),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector(depth),
  (uniqueId: string) =>
    createWsTransport(
      new WebSocket('ws://localhost:' + WS_PORT + '/' + uniqueId),
    ),
  5,
);
