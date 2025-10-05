import {createSynclet} from 'synclets';
import {createWsServer} from 'synclets/server/ws';
import {createWsTransport} from 'synclets/transport/ws';
import {WebSocketServer} from 'ws';
import {pause} from '../common.ts';

test('getWebSocketServer', async () => {
  const wss = new WebSocketServer({port: 0});
  const wsServer = createWsServer(wss);
  expect(wsServer.getWebSocketServer()).toEqual(wss);
  wsServer.destroy();
});

test('Two synclets on single server', async () => {
  const wss = new WebSocketServer({port: 9000});
  const wsServer = createWsServer(wss);

  const synclet1 = await createSynclet({
    transport: createWsTransport(new WebSocket(`ws://localhost:9000`)),
  });
  await synclet1.start();

  const synclet2 = await createSynclet({
    transport: createWsTransport(new WebSocket(`ws://localhost:9000`)),
  });
  await synclet2.start();

  expect(await synclet1.getData()).toEqual(await synclet2.getData());

  await synclet1.setAtom(['a'], 'A');
  await pause(100);

  expect(await synclet1.getData()).toEqual(await synclet2.getData());

  synclet1.destroy();
  synclet2.destroy();
  wsServer.destroy();
});
