import {createSynclet} from 'synclets';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/connector/memory';
import {createStatelessWsServer} from 'synclets/server/stateless-ws';
import {createWsTransport} from 'synclets/transport/ws';
import {expect, test} from 'vitest';
import {WebSocket, WebSocketServer} from 'ws';
import {describeSyncletTests} from '../common.ts';

const WS_PORT = 9001;

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

test('getWebSocket', async () => {
  const wsServer = createStatelessWsServer(
    new WebSocketServer({port: WS_PORT}),
  );
  const webSocket = new WebSocket('ws://localhost:' + WS_PORT);

  const transport = createWsTransport(webSocket);
  const synclet = await createSynclet({transport});
  await synclet.start();

  expect(transport.getWebSocket()).toBe(webSocket);
  expect((synclet.getTransport()[0] as any).getWebSocket()).toBe(webSocket);

  webSocket.close();
  wsServer.destroy();
});
