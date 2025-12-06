import {createSynclet} from 'synclets';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/connector/memory';
import {createWsBrokerTransport, createWsClientTransport} from 'synclets/ws';
import {expect, test} from 'vitest';
import {WebSocket, WebSocketServer} from 'ws';
import {describeCommonConnectorTests} from '../../common.ts';

const WS_PORT = 9002;

describeCommonConnectorTests(
  async () => {
    const wss = new WebSocketServer({port: WS_PORT});
    wss.setMaxListeners(0);
    return wss;
  },
  async (wss: WebSocketServer) => wss.close(),
  <Depth extends number>(depth: Depth) => createMemoryDataConnector({depth}),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector({depth}),
  (_: string, wss: WebSocketServer, syncletNumber: number) =>
    syncletNumber === 0
      ? createWsBrokerTransport(wss)
      : createWsClientTransport(new WebSocket('ws://localhost:' + WS_PORT)),
  5,
);

test('getWebSocketServer', async () => {
  const wss = new WebSocketServer({port: WS_PORT});
  wss.setMaxListeners(0);

  const transport = createWsBrokerTransport(wss);
  const synclet = await createSynclet({transport});
  await synclet.start();

  expect(transport.getWebSocketServer()).toEqual(wss);
  expect((synclet.getTransport()[0] as any).getWebSocketServer()).toEqual(wss);

  await synclet.destroy();
});
