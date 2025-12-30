import {createSynclet, Synclet} from 'synclets';
import {createWsBrokerTransport, type WsBrokerTransport} from 'synclets/ws';
import {WebSocket, WebSocketServer} from 'ws';
import {allocatePort, describeCommonBrokerTests} from '../common.ts';

let serverSynclet: Synclet<1>;

describeCommonBrokerTests(
  async () => {
    serverSynclet = await createSynclet({
      transport: createWsBrokerTransport({
        webSocketServer: new WebSocketServer({
          port: allocatePort(),
        }).setMaxListeners(0),
        brokerPaths: /^valid.*/,
      }),
    });
    await serverSynclet.start();

    return [
      async (path: string) => {
        const webSocket = new WebSocket(
          'ws://localhost:' +
            (
              serverSynclet.getTransport()[0] as WsBrokerTransport
            ).getWebSocketServer().options.port +
            '/' +
            path,
        ).setMaxListeners(0);

        return await new Promise((resolve) => {
          webSocket.on('open', () => resolve({webSocket, status: 101}));
          webSocket.on('error', (e) =>
            resolve({webSocket: null, status: parseInt(e.message.slice(-3))}),
          );
        });
      },
      async () =>
        (serverSynclet.getTransport()[0] as WsBrokerTransport).getPaths(),
      async (path: string) =>
        (serverSynclet.getTransport()[0] as WsBrokerTransport).getClientIds(
          path,
        ),
    ] as const;
  },

  async () => {
    serverSynclet.destroy();
    (serverSynclet.getTransport()[0] as WsBrokerTransport)
      .getWebSocketServer()
      .close();
  },
);
