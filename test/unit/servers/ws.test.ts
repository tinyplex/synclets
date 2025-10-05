import {createWsServer} from 'synclets/server/ws';
import {WebSocketServer} from 'ws';

test('getWebSocketServer', async () => {
  const wss = new WebSocketServer({port: 0});
  const wsServer = createWsServer(wss);
  expect(wsServer.getWebSocketServer()).toEqual(wss);
  wsServer.destroy();
});
