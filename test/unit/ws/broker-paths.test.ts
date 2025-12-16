import {createSynclet} from 'synclets';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/memory';
import {createWsBrokerTransport, createWsClientTransport} from 'synclets/ws';
import {expect, test} from 'vitest';
import {WebSocket, WebSocketServer} from 'ws';
import {pause} from '../common.ts';

let portCounter = 9100;
const getPort = () => portCounter++;

test('default path means synclet participates on /', async () => {
  const port = getPort();
  const wss = new WebSocketServer({port}).setMaxListeners(0);

  const synclet = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsBrokerTransport(wss),
  });
  await synclet.start();

  const serverRoomClient = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/').setMaxListeners(0),
    ),
  });
  await serverRoomClient.start();

  const otherRoomClient = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/r2').setMaxListeners(0),
    ),
  });
  await otherRoomClient.start();

  await synclet.setAtom(['a'], 'A');
  await pause(10);

  expect(await serverRoomClient.getData()).toEqual({a: 'A'});
  expect(await otherRoomClient.getData()).toEqual({});

  await synclet.destroy();
  await serverRoomClient.destroy();
  await otherRoomClient.destroy();
  wss.close();
});

test('specific path means synclet participates there', async () => {
  const port = getPort();
  const wss = new WebSocketServer({port}).setMaxListeners(0);

  const synclet = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsBrokerTransport(wss, {path: 'p1'}),
  });
  await synclet.start();

  const serverRoomClient = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/p1').setMaxListeners(0),
    ),
  });
  await serverRoomClient.start();

  const otherRoomClient = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/r2').setMaxListeners(0),
    ),
  });
  await otherRoomClient.start();

  await synclet.setAtom(['a'], 'A');
  await pause(10);

  expect(await serverRoomClient.getData()).toEqual({a: 'A'});
  expect(await otherRoomClient.getData()).toEqual({});

  await synclet.destroy();
  await serverRoomClient.destroy();
  await otherRoomClient.destroy();
  wss.close();
});

test('path: null with brokerPaths regex (broker-only setup)', async () => {
  const port = getPort();
  const wss = new WebSocketServer({port}).setMaxListeners(0);

  const serverSynclet = await createSynclet({
    transport: createWsBrokerTransport(wss, {brokerPaths: /r[123]/}),
  });

  const client1 = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/r1').setMaxListeners(0),
    ),
  });
  await client1.start();

  const client2 = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/r1').setMaxListeners(0),
    ),
  });
  await client2.start();

  await client1.setAtom(['a'], 'A');
  await pause(10);

  expect(await client2.getData()).toEqual({a: 'A'});

  await serverSynclet.destroy();
  await client1.destroy();
  await client2.destroy();
  wss.close();
});

test('brokerPaths isolates different rooms', async () => {
  const port = getPort();
  const wss = new WebSocketServer({port}).setMaxListeners(0);

  const serverSynclet = await createSynclet({
    transport: createWsBrokerTransport(wss, {brokerPaths: /r[123]/}),
  });

  const room1client1 = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/r1').setMaxListeners(0),
    ),
  });
  await room1client1.start();

  const room1client2 = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/r1').setMaxListeners(0),
    ),
  });
  await room1client2.start();

  const room2client = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/r2').setMaxListeners(0),
    ),
  });
  await room2client.start();

  await room1client1.setAtom(['a'], 'r1');
  await pause(10);
  await room2client.setAtom(['a'], 'r2');
  await pause(10);

  expect(await room1client1.getData()).toEqual({a: 'r1'});
  expect(await room1client2.getData()).toEqual({a: 'r1'});
  expect(await room2client.getData()).toEqual({a: 'r2'});

  await serverSynclet.destroy();
  await room1client1.destroy();
  await room1client2.destroy();
  await room2client.destroy();
  wss.close();
});

test('path participates, brokerPaths only brokers', async () => {
  const port = getPort();
  const wss = new WebSocketServer({port}).setMaxListeners(0);
  wss.setMaxListeners(0);

  const synclet = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsBrokerTransport(wss, {
      path: 'p1',
      brokerPaths: /r[123]/,
    }),
  });
  await synclet.start();

  const serverRoomClient = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/p1').setMaxListeners(0),
    ),
  });
  await serverRoomClient.start();

  const room1client1 = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/r1').setMaxListeners(0),
    ),
  });
  await room1client1.start();

  const room1client2 = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/r1').setMaxListeners(0),
    ),
  });
  await room1client2.start();

  await synclet.setAtom(['server'], 'data');
  await pause(10);
  await room1client1.setAtom(['room'], 'chat');
  await pause(10);

  expect(await synclet.getData()).toEqual({server: 'data'});
  expect(await serverRoomClient.getData()).toEqual({server: 'data'});
  expect(await room1client1.getData()).toEqual({room: 'chat'});
  expect(await room1client2.getData()).toEqual({room: 'chat'});

  await synclet.destroy();
  await serverRoomClient.destroy();
  await room1client1.destroy();
  await room1client2.destroy();
  wss.close();
});

test('brokerPaths with complex regex pattern', async () => {
  const port = getPort();
  const wss = new WebSocketServer({port}).setMaxListeners(0);
  wss.setMaxListeners(0);

  const serverSynclet = await createSynclet({
    transport: createWsBrokerTransport(wss, {brokerPaths: /(p1|p2)\/[\w-]+/}),
  });

  const gameLobbyClient = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/p1/a').setMaxListeners(0),
    ),
  });
  await gameLobbyClient.start();

  const chatGeneralClient = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/p2/b').setMaxListeners(0),
    ),
  });
  await chatGeneralClient.start();

  await gameLobbyClient.setAtom(['a'], 'p1a');
  await chatGeneralClient.setAtom(['a'], 'p2b');
  await pause(10);

  expect(await gameLobbyClient.getData()).toEqual({a: 'p1a'});
  expect(await chatGeneralClient.getData()).toEqual({a: 'p2b'});

  await serverSynclet.destroy();
  await gameLobbyClient.destroy();
  await chatGeneralClient.destroy();
  wss.close();
});

test('path without leading slash works correctly', async () => {
  const port = getPort();
  const wss = new WebSocketServer({port}).setMaxListeners(0);

  const synclet = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsBrokerTransport(wss, {path: 'p1'}),
  });
  await synclet.start();

  const serverRoomClient = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/p1').setMaxListeners(0),
    ),
  });
  await serverRoomClient.start();

  await synclet.setAtom(['a'], 'A');
  await pause(10);

  expect(await serverRoomClient.getData()).toEqual({a: 'A'});

  await synclet.destroy();
  await serverRoomClient.destroy();
  wss.close();
});

test('connection rejected when does not match brokerPaths regex', async () => {
  const port = getPort();
  const wss = new WebSocketServer({port}).setMaxListeners(0);

  const serverSynclet = await createSynclet({
    transport: createWsBrokerTransport(wss, {brokerPaths: /r[123]/}),
  });

  const ws = new WebSocket('ws://localhost:' + port + '/invalid');

  await new Promise((resolve) => {
    ws.on('error', () => resolve('error'));
    ws.on('close', () => resolve('close'));
  });

  expect(ws.readyState).toBe(WebSocket.CLOSED);

  await serverSynclet.destroy();
  wss.close();
});

test('default brokerPaths accepts any path', async () => {
  const port = getPort();
  const wss = new WebSocketServer({port}).setMaxListeners(0);

  const serverSynclet = await createSynclet({
    transport: createWsBrokerTransport(wss),
  });

  const room1client = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/r1').setMaxListeners(0),
    ),
  });
  await room1client.start();

  const room2client = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/r2').setMaxListeners(0),
    ),
  });
  await room2client.start();

  const room3client = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/r3').setMaxListeners(0),
    ),
  });
  await room3client.start();

  await room1client.setAtom(['a'], 'r1');
  await room2client.setAtom(['b'], 'r2');
  await room3client.setAtom(['c'], 'r3');
  await pause(10);

  expect(await room1client.getData()).toEqual({a: 'r1'});
  expect(await room2client.getData()).toEqual({b: 'r2'});
  expect(await room3client.getData()).toEqual({c: 'r3'});

  await serverSynclet.destroy();
  await room1client.destroy();
  await room2client.destroy();
  await room3client.destroy();
  wss.close();
});
