import {createServer, Server} from 'http';
import {createSynclet, type Synclet} from 'synclets';
import {
  createWsBrokerTransport,
  getWebSocketServerUpgradeHandler,
  type WsBrokerTransport,
} from 'synclets/ws';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {WebSocket, WebSocketServer} from 'ws';
import {
  allocatePort,
  createClients,
  describeCommonBrokerTests,
  pause,
} from '../common.ts';

let synclet: Synclet<1>;

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
    synclet = await createSynclet({
      transport: createWsBrokerTransport({
        webSocketServer: new WebSocketServer({
          port: allocatePort(),
        }).setMaxListeners(0),
      }),
    });
    await synclet.start();

    return [
      (path: string) =>
        connect(
          (synclet.getTransport()[0] as WsBrokerTransport).getWebSocketServer()
            .options.port!,
          path,
        ),
      async () =>
        (synclet.getTransport()[0] as WsBrokerTransport).getClientIds(),
    ] as const;
  },

  async () => {
    synclet.destroy();
    (synclet.getTransport()[0] as WsBrokerTransport)
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

  test('single webSocketServer, two paths', async () => {
    const synclet = await createSynclet({
      transport: createWsBrokerTransport({
        webSocketServer: new WebSocketServer({
          server: httpServer,
        }).setMaxListeners(0),
      }),
    });
    await synclet.start();

    const [[ws1, ws2], [received1, received2]] = await createClients(
      2,
      (path: string) => connect(port, path),
    );

    expect(
      (synclet.getTransport()[0] as WsBrokerTransport).getClientIds().length,
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
    await synclet.destroy();
    (synclet.getTransport()[0] as WsBrokerTransport)
      .getWebSocketServer()
      .close();
  });

  test('single webSocketServer, manual upgrade, two paths', async () => {
    const wss = new WebSocketServer({noServer: true}).setMaxListeners(0);
    const synclet = await createSynclet({
      transport: createWsBrokerTransport({
        webSocketServer: wss,
      }),
    });
    await synclet.start();

    httpServer.on(
      'upgrade',
      getWebSocketServerUpgradeHandler(() => wss),
    );

    const [[ws1, ws2], [received1, received2]] = await createClients(
      2,
      (path: string) => connect(port, path),
    );

    expect(
      (synclet.getTransport()[0] as WsBrokerTransport).getClientIds().length,
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
    await synclet.destroy();
    wss.close();
  });

  test('two webSocketServers, manual upgrade, two paths', async () => {
    const wss1 = new WebSocketServer({noServer: true}).setMaxListeners(0);
    const synclet1 = await createSynclet({
      transport: createWsBrokerTransport({
        webSocketServer: wss1,
      }),
    });
    await synclet1.start();

    const wss2 = new WebSocketServer({noServer: true}).setMaxListeners(0);
    const synclet2 = await createSynclet({
      transport: createWsBrokerTransport({
        webSocketServer: wss2,
      }),
    });
    await synclet2.start();

    httpServer.on(
      'upgrade',
      getWebSocketServerUpgradeHandler((request) => {
        const pathname = new URL(request.url!, 'ws://localhost').pathname;
        if (pathname === '/p1') {
          return wss1;
        }
        if (pathname === '/p2') {
          return wss2;
        }
        return undefined;
      }),
    );

    const [[ws1p1, ws2p1], [received1p1, received2p1]] = await createClients(
      2,
      (path: string) => connect(port, path),
      () => 'p1',
    );

    const [[ws1p2, ws2p2], [received1p2, received2p2]] = await createClients(
      2,
      (path: string) => connect(port, path),
      () => 'p2',
    );

    expect(
      (synclet1.getTransport()[0] as WsBrokerTransport).getClientIds().length,
    ).toEqual(2);
    expect(
      (synclet2.getTransport()[0] as WsBrokerTransport).getClientIds().length,
    ).toEqual(2);

    ws1p1.send('* from1p1To*');
    await pause(transportPause);
    ws2p1.send('* from2p1To*');
    await pause(transportPause);

    expect(received1p1.length).toEqual(1);
    expect(received1p1[0][1]).toEqual('from2p1To*');
    expect(received2p1.length).toEqual(1);
    expect(received2p1[0][1]).toEqual('from1p1To*');
    expect(received1p2.length).toEqual(0);
    expect(received1p2.length).toEqual(0);

    ws1p2.send('* from1p2To*');
    await pause(transportPause);
    ws2p2.send('* from2p2To*');
    await pause(transportPause);

    expect(received1p1.length).toEqual(1);
    expect(received1p1.length).toEqual(1);
    expect(received1p2.length).toEqual(1);
    expect(received1p2[0][1]).toEqual('from2p2To*');
    expect(received2p2.length).toEqual(1);
    expect(received2p2[0][1]).toEqual('from1p2To*');

    ws1p1.close();
    ws2p1.close();
    ws1p2.close();
    ws2p2.close();

    await synclet1.destroy();
    await synclet2.destroy();
    wss1.close();
    wss2.close();
  });
});
