import {createSynclet} from 'synclets';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/connector/memory';
import {createWsBroker, createWsClientTransport} from 'synclets/ws';
import {expect, test} from 'vitest';
import {WebSocket, WebSocketServer} from 'ws';
import {pause} from '../../common.ts';

const WS_PORT = 9000;

test('getWebSocketServer', async () => {
  const wss = new WebSocketServer({port: WS_PORT});
  wss.setMaxListeners(0);
  const wsServer = await createWsBroker(wss);
  expect(wsServer.getWebSocketServer()).toEqual(wss);
  wsServer.destroy();
  wss.close();
});

test('Two synclets on single server', async () => {
  const wss = new WebSocketServer({port: WS_PORT});
  wss.setMaxListeners(0);
  const wsServer = await createWsBroker(wss);

  const synclet1 = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + WS_PORT),
    ),
  });
  await synclet1.start();

  const synclet2 = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
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
