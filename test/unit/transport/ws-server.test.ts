import {createSynclet} from 'synclets';
import {createWsServerTransport} from 'synclets/transport/ws';
import {expect, test} from 'vitest';
import {WebSocketServer} from 'ws';

const WS_PORT = 9002;

test('getWebSocketServer', async () => {
  const wss = new WebSocketServer({port: WS_PORT});

  const transport = createWsServerTransport(wss);
  const synclet = await createSynclet({transport});
  await synclet.start();

  expect(transport.getWebSocketServer()).toEqual(wss);
  expect((synclet.getTransport()[0] as any).getWebSocketServer()).toEqual(wss);

  wss.close();
});
