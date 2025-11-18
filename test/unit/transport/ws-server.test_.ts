import {createSynclet} from 'synclets';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/connector/memory';
import {
  createWsClientTransport,
  createWsServerTransport,
} from 'synclets/transport/ws';
import {expect, test} from 'vitest';
import {WebSocket, WebSocketServer} from 'ws';
import {describeCommonConnectorTests} from '../common.ts';

const WS_PORT = 9002;

describeCommonConnectorTests(
  async () => {},
  async () => {},
  <Depth extends number>(depth: Depth) => createMemoryDataConnector(depth),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector(depth),
  (_: string, syncletNumber: number) =>
    syncletNumber === 0
      ? createWsServerTransport(new WebSocketServer({port: WS_PORT}))
      : createWsClientTransport(new WebSocket('ws://localhost:' + WS_PORT)),
  5,
  [1],
);

test('getWebSocketServer', async () => {
  const wss = new WebSocketServer({port: WS_PORT});

  const transport = createWsServerTransport(wss);
  const synclet = await createSynclet({transport});
  await synclet.start();

  expect(transport.getWebSocketServer()).toEqual(wss);
  expect((synclet.getTransport()[0] as any).getWebSocketServer()).toEqual(wss);

  wss.close();
});
