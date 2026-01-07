import {createServer, Server} from 'http';
import {createSynclet, type Synclet} from 'synclets';
import {createWsBrokerTransport, type WsBrokerTransport} from 'synclets/ws';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {WebSocket, WebSocketServer} from 'ws';
import {
  allocatePort,
  createClients,
  describeCommonBrokerTests,
  pause,
} from '../common.ts';

let serverSynclet: Synclet<1>;

const connect = async (
  port: number,
  path: string,
): Promise<{webSocket: WebSocket | null; status: number}> => {
  const webSocket = new WebSocket(
    'ws://localhost:' + port + '/' + path,
  ).setMaxListeners(0);

  return await new Promise((resolve) => {
    webSocket.on('open', () => resolve({webSocket, status: 101}));
    webSocket.on('error', (e) =>
      resolve({webSocket: null, status: parseInt(e.message.slice(-3))}),
    );
  });
};

describeCommonBrokerTests(
  async () => {
    serverSynclet = await createSynclet({
      transport: createWsBrokerTransport({
        webSocketServer: new WebSocketServer({
          port: allocatePort(),
        }).setMaxListeners(0),
      }),
    });
    await serverSynclet.start();

    return [
      (path: string) =>
        connect(
          (
            serverSynclet.getTransport()[0] as WsBrokerTransport
          ).getWebSocketServer().options.port!,
          path,
        ),
      async () =>
        (serverSynclet.getTransport()[0] as WsBrokerTransport).getClientIds(),
    ] as const;
  },

  async () => {
    serverSynclet.destroy();
    (serverSynclet.getTransport()[0] as WsBrokerTransport)
      .getWebSocketServer()
      .close();
  },
);

describe('external httpServer', () => {
  const transportPause = 5;
  let httpServer: Server;
  let port: number;

  beforeEach(async () => {
    port = allocatePort();
    httpServer = createServer();
    await new Promise<void>((resolve) => {
      httpServer.listen(port, () => resolve());
    });
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  test('single webSocketServer serving both paths', async () => {
    serverSynclet = await createSynclet({
      transport: createWsBrokerTransport({
        webSocketServer: new WebSocketServer({
          server: httpServer,
        }).setMaxListeners(0),
      }),
    });
    await serverSynclet.start();

    const [[ws1, ws2], [received1, received2]] = await createClients(
      2,
      (path: string) => connect(port, path),
    );

    expect(
      (serverSynclet.getTransport()[0] as WsBrokerTransport).getClientIds()
        .length,
    ).toEqual(2);

    ws1.send('* from1To*');
    await pause(transportPause);

    ws2.send('* from2To*');
    await pause(transportPause);

    expect(received1.length).toEqual(1);
    expect(received1[0][1]).toEqual('from2To*');
    expect(received2.length).toEqual(1);
    expect(received2[0][1]).toEqual('from1To*');

    ws1.close();
    ws2.close();
    await serverSynclet.destroy();
    (serverSynclet.getTransport()[0] as WsBrokerTransport)
      .getWebSocketServer()
      .close();
  });
});
