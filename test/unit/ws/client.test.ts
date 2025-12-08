import {createSynclet} from 'synclets';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/memory';
import {createWsClientTransport, createWsPureBroker} from 'synclets/ws';
import {expect, test} from 'vitest';
import {WebSocket, WebSocketServer} from 'ws';
import {describeCommonConnectorTests} from '../common.ts';

const WS_PORT = 9001;

describeCommonConnectorTests(
  async () => {
    const wss = new WebSocketServer({port: WS_PORT});
    wss.setMaxListeners(0);
    return createWsPureBroker(wss);
  },
  async (wsServer) => {
    wsServer.destroy();
    wsServer.getWebSocketServer().close();
  },
  <Depth extends number>(depth: Depth) => createMemoryDataConnector({depth}),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector({depth}),
  (uniqueId: string) =>
    createWsClientTransport(
      new WebSocket('ws://localhost:' + WS_PORT + '/' + uniqueId),
    ),
  5,
);

test('getWebSocket', async () => {
  const wss = new WebSocketServer({port: WS_PORT});
  wss.setMaxListeners(0);
  const wsServer = await createWsPureBroker(wss);
  const webSocket = new WebSocket('ws://localhost:' + WS_PORT);

  const transport = createWsClientTransport(webSocket);
  const synclet = await createSynclet({transport});
  await synclet.start();

  expect(transport.getWebSocket()).toEqual(webSocket);
  expect((synclet.getTransport()[0] as any).getWebSocket()).toEqual(webSocket);

  await synclet.destroy();

  webSocket.close();
  wsServer.destroy();
  wsServer.getWebSocketServer().close();
});
