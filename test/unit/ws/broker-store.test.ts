import {createSynclet} from 'synclets';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/memory';
import {
  createWsBrokerTransport,
  createWsClientTransport,
  type WsBrokerTransport,
} from 'synclets/ws';
import {expect} from 'vitest';
import {WebSocket, WebSocketServer} from 'ws';
import {allocatePort, describeCommonSyncletTests} from '../common.ts';

describeCommonSyncletTests(
  async () => {},
  async () => {},
  async (depth) => {
    const serverSynclet = await createSynclet({
      dataConnector: createMemoryDataConnector({depth}),
      metaConnector: createMemoryMetaConnector({depth}),
      transport: createWsBrokerTransport({
        webSocketServer: new WebSocketServer({
          port: allocatePort(),
        }).setMaxListeners(0),
      }),
    });
    await serverSynclet.start();
    return serverSynclet;
  },
  async (serverSynclet, finalData) => {
    expect(await serverSynclet.getData()).toEqual(finalData);
    serverSynclet.destroy();
    (serverSynclet.getTransport()[0] as WsBrokerTransport)
      .getWebSocketServer()
      .close();
  },
  <Depth extends number>(depth: Depth) => createMemoryDataConnector({depth}),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector({depth}),
  (_, serverSynclet) =>
    createWsClientTransport({
      webSocket: new WebSocket(
        'ws://localhost:' +
          (
            serverSynclet.getTransport()[0] as WsBrokerTransport
          ).getWebSocketServer().options.port,
      ).setMaxListeners(0),
    }),
  5,
  undefined,
  undefined,
  ['pool'],
);
