import {createSynclet} from 'synclets';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/memory';
import {
  createWsBrokerTransport,
  createWsClientTransport,
  createWsPureBroker,
} from 'synclets/ws';
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
      new WebSocket('ws://localhost:' + port + '/otherRoom').setMaxListeners(0),
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
    transport: createWsBrokerTransport(wss, {path: 'serverRoom'}),
  });
  await synclet.start();

  const serverRoomClient = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/serverRoom').setMaxListeners(
        0,
      ),
    ),
  });
  await serverRoomClient.start();

  const otherRoomClient = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/otherRoom').setMaxListeners(0),
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

  const broker = await createWsPureBroker(wss, /room[123]/);

  const client1 = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/room1').setMaxListeners(0),
    ),
  });
  await client1.start();

  const client2 = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/room1').setMaxListeners(0),
    ),
  });
  await client2.start();

  await client1.setAtom(['a'], 'A');
  await pause(10);

  expect(await client2.getData()).toEqual({a: 'A'});

  await broker.destroy();
  await client1.destroy();
  await client2.destroy();
  wss.close();
});

test('brokerPaths isolates different rooms', async () => {
  const port = getPort();
  const wss = new WebSocketServer({port}).setMaxListeners(0);

  const broker = await createWsPureBroker(wss, /room[123]/);

  const room1client1 = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/room1').setMaxListeners(0),
    ),
  });
  await room1client1.start();

  const room1client2 = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/room1').setMaxListeners(0),
    ),
  });
  await room1client2.start();

  const room2client = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/room2').setMaxListeners(0),
    ),
  });
  await room2client.start();

  await room1client1.setAtom(['a'], 'room1');
  await pause(10);
  await room2client.setAtom(['a'], 'room2');
  await pause(10);

  expect(await room1client1.getData()).toEqual({a: 'room1'});
  expect(await room1client2.getData()).toEqual({a: 'room1'});
  expect(await room2client.getData()).toEqual({a: 'room2'});

  await broker.destroy();
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
      path: 'serverRoom',
      brokerPaths: /room[123]/,
    }),
  });
  await synclet.start();

  const serverRoomClient = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/serverRoom').setMaxListeners(
        0,
      ),
    ),
  });
  await serverRoomClient.start();

  const room1client1 = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/room1').setMaxListeners(0),
    ),
  });
  await room1client1.start();

  const room1client2 = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/room1').setMaxListeners(0),
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

  const broker = await createWsPureBroker(wss, /(game|chat)\/[\w-]+/);

  const gameLobbyClient = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/game/lobby').setMaxListeners(
        0,
      ),
    ),
  });
  await gameLobbyClient.start();

  const chatGeneralClient = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/chat/general').setMaxListeners(
        0,
      ),
    ),
  });
  await chatGeneralClient.start();

  await gameLobbyClient.setAtom(['a'], 'game');
  await chatGeneralClient.setAtom(['a'], 'chat');
  await pause(10);

  expect(await gameLobbyClient.getData()).toEqual({a: 'game'});
  expect(await chatGeneralClient.getData()).toEqual({a: 'chat'});

  await broker.destroy();
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
    transport: createWsBrokerTransport(wss, {path: 'serverRoom'}),
  });
  await synclet.start();

  const serverRoomClient = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/serverRoom').setMaxListeners(
        0,
      ),
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

test('default brokerPaths accepts any path', async () => {
  const port = getPort();
  const wss = new WebSocketServer({port}).setMaxListeners(0);

  const broker = await createWsPureBroker(wss);

  const room1client = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/room1').setMaxListeners(0),
    ),
  });
  await room1client.start();

  const room2client = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/room2').setMaxListeners(0),
    ),
  });
  await room2client.start();

  const room3client = await createSynclet({
    dataConnector: createMemoryDataConnector({depth: 1}),
    metaConnector: createMemoryMetaConnector({depth: 1}),
    transport: createWsClientTransport(
      new WebSocket('ws://localhost:' + port + '/room3').setMaxListeners(0),
    ),
  });
  await room3client.start();

  await room1client.setAtom(['a'], 'room1');
  await room2client.setAtom(['b'], 'room2');
  await room3client.setAtom(['c'], 'room3');
  await pause(10);

  expect(await room1client.getData()).toEqual({a: 'room1'});
  expect(await room2client.getData()).toEqual({b: 'room2'});
  expect(await room3client.getData()).toEqual({c: 'room3'});

  await broker.destroy();
  await room1client.destroy();
  await room2client.destroy();
  await room3client.destroy();
  wss.close();
});
