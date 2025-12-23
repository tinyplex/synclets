import {createSynclet} from 'synclets';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/memory';
import {createWsBrokerTransport, createWsClientTransport} from 'synclets/ws';
import {expect, test} from 'vitest';
import {WebSocket, WebSocketServer} from 'ws';
import {allocatePort, pause} from '../common.ts';

const PORT = allocatePort();

test('Two synclets on single server', async () => {
  const wss = new WebSocketServer({port: PORT}).setMaxListeners(0);
  const serverSynclet = await createSynclet({
    transport: createWsBrokerTransport({webSocketServer: wss}),
  });

  const synclet1 = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + PORT).setMaxListeners(0),
    ),
  });
  await synclet1.start();

  const synclet2 = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + PORT).setMaxListeners(0),
    ),
  });
  await synclet2.start();

  expect(await synclet1.getData()).toEqual(await synclet2.getData());

  await synclet1.setAtom(['a'], 'A');
  await pause(10);

  expect(await synclet1.getData()).toEqual(await synclet2.getData());

  await synclet1.destroy();
  await synclet2.destroy();
  serverSynclet.destroy();
  wss.close();
});
