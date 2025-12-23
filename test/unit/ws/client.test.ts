import {createSynclet} from 'synclets';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/memory';
import {createWsBrokerTransport, createWsClientTransport} from 'synclets/ws';
import {expect, test} from 'vitest';
import {WebSocket, WebSocketServer} from 'ws';
import {allocatePort, describeCommonConnectorTests} from '../common.ts';

describeCommonConnectorTests(
  async () => {
    const wss = new WebSocketServer({port: allocatePort()}).setMaxListeners(0);
    return [
      await createSynclet({
        transport: createWsBrokerTransport({webSocketServer: wss}),
      }),
      wss,
    ] as const;
  },
  async ([serverSynclet, wss]) => {
    serverSynclet.destroy();
    wss.close();
  },
  <Depth extends number>(depth: Depth) => createMemoryDataConnector({depth}),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector({depth}),
  (uniqueId: string, [, wss]) =>
    createWsClientTransport({
      webSocket: new WebSocket(
        'ws://localhost:' + wss.options.port + '/' + uniqueId,
      ).setMaxListeners(0),
    }),
  5,
);

test('getWebSocket', async () => {
  const wss = new WebSocketServer({port: allocatePort()}).setMaxListeners(0);
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
