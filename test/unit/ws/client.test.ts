import {createSynclet} from 'synclets';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/memory';
import {
  createWsBrokerTransport,
  createWsClientTransport,
  type WsBrokerTransport,
} from 'synclets/ws';
import {expect, test} from 'vitest';
import {WebSocket, WebSocketServer} from 'ws';
import {allocatePort, describeCommonSyncletTests} from '../common.ts';

const PORT = allocatePort();

describeCommonSyncletTests(
  async () => {},
  async () => {},
  async () => {
    const webSocketServer = new WebSocketServer({
      port: allocatePort(),
    }).setMaxListeners(0);
    const serverSynclet = await createSynclet({
      transport: createWsBrokerTransport({webSocketServer}),
    });
    await serverSynclet.start();
    return serverSynclet;
  },
  async (serverSynclet) => {
    expect(await serverSynclet.getData()).toEqual({});
    serverSynclet.destroy();
    (serverSynclet.getTransport()[0] as WsBrokerTransport)
      .getWebSocketServer()
      .close();
  },
  <Depth extends number>(depth: Depth) => createMemoryDataConnector({depth}),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector({depth}),
  (_, serverSynclet) =>
    createWsClientTransport({
      webSocket: new WebSocket(
        'ws://localhost:' +
          (
            serverSynclet.getTransport()[0] as WsBrokerTransport
          ).getWebSocketServer().options.port,
      ).setMaxListeners(0),
    }),
  5,
);

test('getWebSocket', async () => {
  const wss = new WebSocketServer({port: PORT}).setMaxListeners(0);
  const serverSynclet = await createSynclet({
    transport: createWsBrokerTransport({webSocketServer: wss}),
  });
  const webSocket = new WebSocket(
    'ws://localhost:' + wss.options.port,
  ).setMaxListeners(0);
  const transport = createWsClientTransport({webSocket});
  const synclet = await createSynclet({transport});
  await synclet.start();

  expect(transport.getWebSocket()).toEqual(webSocket);
  expect((synclet.getTransport()[0] as any).getWebSocket()).toEqual(webSocket);

  await synclet.destroy();

  webSocket.close();
  serverSynclet.destroy();
  wss.close();
});
