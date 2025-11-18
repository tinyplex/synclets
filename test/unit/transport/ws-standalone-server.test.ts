import {createSynclet} from 'synclets';
import {createWsClientTransport, createWsServer} from 'synclets/transport/ws';
import {expect, test} from 'vitest';
import {WebSocket, WebSocketServer} from 'ws';
import {pause} from '../common.ts';

const WS_PORT = 9000;

test('getWebSocketServer', async () => {
  const wss = new WebSocketServer({port: WS_PORT});
  const wsServer = createWsServer(wss);
  expect(wsServer.getWebSocketServer()).toEqual(wss);
  wsServer.destroy();
  wss.close();
});

test('Two synclets on single server', async () => {
  const wsServer = createWsServer(new WebSocketServer({port: WS_PORT}));

  const synclet1 = await createSynclet({
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + WS_PORT),
    ),
  });
  await synclet1.start();

  const synclet2 = await createSynclet({
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + WS_PORT),
    ),
  });
  await synclet2.start();

  expect(await synclet1.getData()).toEqual(await synclet2.getData());

  await synclet1.setAtom(['a'], 'A');
  await pause(10);

  expect(await synclet1.getData()).toEqual(await synclet2.getData());

  await synclet1.destroy();
  await synclet2.destroy();
  wsServer.destroy();
  wsServer.getWebSocketServer().close();
});
