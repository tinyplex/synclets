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
  async () => new WebSocketServer({port: allocatePort()}).setMaxListeners(0),
  async (wss: WebSocketServer) => wss.close(),
  <Depth extends number>(depth: Depth) => createMemoryDataConnector({depth}),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector({depth}),
  (_: string, wss: WebSocketServer, syncletNumber: number) =>
    syncletNumber === 0
      ? createWsBrokerTransport({webSocketServer: wss})
      : createWsClientTransport({
          webSocket: new WebSocket(
            'ws://localhost:' + wss.options.port,
          ).setMaxListeners(0),
        }),
  5,
);

test('getWebSocketServer', async () => {
  const wss = new WebSocketServer({port: allocatePort()}).setMaxListeners(0);

  const transport = createWsBrokerTransport({webSocketServer: wss});
  const synclet = await createSynclet({transport});
  await synclet.start();

  expect(transport.getWebSocketServer()).toEqual(wss);
  expect((synclet.getTransport()[0] as any).getWebSocketServer()).toEqual(wss);

  await synclet.destroy();
});
