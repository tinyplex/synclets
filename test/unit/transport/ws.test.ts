import {createSynclet} from 'synclets';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/connector/memory';
import {createStatelessWsServer} from 'synclets/server/stateless-ws';
import {createWsClientTransport} from 'synclets/transport/ws';
import {expect, test} from 'vitest';
import {WebSocket, WebSocketServer} from 'ws';
import {describeCommonConnectorTests} from '../common.ts';

const WS_PORT = 9001;

describeCommonConnectorTests(
  async () => createStatelessWsServer(new WebSocketServer({port: WS_PORT})),
  async (wsServer) => wsServer.destroy(),
  <Depth extends number>(depth: Depth) => createMemoryDataConnector(depth),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector(depth),
  (uniqueId: string) =>
    createWsClientTransport(
      new WebSocket('ws://localhost:' + WS_PORT + '/' + uniqueId),
    ),
  5,
);

test('getWebSocket', async () => {
  const wsServer = createStatelessWsServer(
    new WebSocketServer({port: WS_PORT}),
  );
  const webSocket = new WebSocket('ws://localhost:' + WS_PORT);

  const transport = createWsClientTransport(webSocket);
  const synclet = await createSynclet({transport});
  await synclet.start();

  expect(transport.getWebSocket()).toEqual(webSocket);
  expect((synclet.getTransport()[0] as any).getWebSocket()).toEqual(webSocket);

  webSocket.close();
  wsServer.destroy();
});
