import {createSynclet} from 'synclets';
import {createWsBrokerTransport, createWsClientTransport} from 'synclets/ws';
import {expect, test} from 'vitest';
import {WebSocket, WebSocketServer} from 'ws';
import {allocatePort} from '../common.ts';

test('getWebSocketServer', async () => {
  const wss = new WebSocketServer({port: allocatePort()}).setMaxListeners(0);

  const transport = createWsBrokerTransport({webSocketServer: wss});
  const synclet = await createSynclet({transport});
  await synclet.start();

  expect(transport.getWebSocketServer()).toEqual(wss);
  expect((synclet.getTransport()[0] as any).getWebSocketServer()).toEqual(wss);

  await synclet.destroy();
});

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
