import {DurableObjectStub} from '@cloudflare/workers-types';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
import {getPartsFromPacket} from 'synclets/utils';
import {fileURLToPath} from 'url';
import {afterAll, beforeAll, expect, test} from 'vitest';
import {pause} from '../unit/common.ts';

let miniflare: Miniflare;
let stub: DurableObjectStub;

const createClients = async (number: number) => {
  const received: [string, string][][] = Array.from({length: number}, () => []);
  const webSockets: any[] = [];
  for (let i = 0; i < number; i++) {
    const {webSocket} = await stub.fetch('http://localhost/test', {
      headers: {upgrade: 'websocket'},
    });
    if (!webSocket) throw new Error('failed to obtain WebSocket from stub');
    webSocket.accept();
    webSocket.addEventListener('message', (event: any) =>
      received[i].push(getPartsFromPacket(event.data)),
    );
    webSockets.push(webSocket);
  }
  return [webSockets, received];
};

beforeAll(async () => {
  const entry = fileURLToPath(new URL('./server.ts', import.meta.url));

  const {
    outputFiles: [{text: script}],
  } = await build({
    entryPoints: [entry],
    write: false,
    bundle: true,
    format: 'esm',
    target: ['es2020'],
    external: ['cloudflare:workers'],
  });

  miniflare = new Miniflare({
    script,
    modules: true,
    durableObjects: {test: 'TestServerDurableObject'},
    compatibilityDate: '2025-12-02',
  });
  await miniflare.ready;

  const namespace = await miniflare.getDurableObjectNamespace('test');
  stub = namespace.get(namespace.idFromName('test')) as any;
});

afterAll(async () => {
  await miniflare.dispose();
});

test('instantiated and accessed', async () => {
  expect(stub).toBeDefined();
});

test('return 426 for non-WebSocket requests', async () => {
  const response = await stub.fetch('http://localhost/test');
  expect(response.status).toBe(426);
  expect(await response.text()).toBe('Upgrade required');
});

test('accept WebSocket upgrade requests', async () => {
  const response = await stub.fetch('http://localhost/test', {
    headers: {upgrade: 'websocket'},
  });
  expect(response.status).toBe(101);
  expect(response.webSocket).toBeDefined();
});

test.only('2 clients communicate', async () => {
  const [[webSocket1, webSocket2], [received1, received2]] =
    await createClients(2);

  webSocket1.send('* from1To*');
  webSocket2.send('* from2To*');

  await pause(10);

  expect(received1.length).toBe(1);
  expect(received2.length).toBe(1);
  expect(received1[0][1]).toBe('from2To*');
  expect(received2[0][1]).toBe('from1To*');
  const client1Id = received2[0][0];
  const client2Id = received1[0][0];

  webSocket1.send(client2Id + ' from1To2');
  webSocket2.send(client1Id + ' from2To1');
  webSocket1.send('foo undeliverable');
  webSocket2.send('bar undeliverable');

  await pause(10);

  expect(received1).toEqual([
    [client2Id, 'from2To*'],
    [client2Id, 'from2To1'],
  ]);
  expect(received2).toEqual([
    [client1Id, 'from1To*'],
    [client1Id, 'from1To2'],
  ]);
});

test.only('3 clients communicate', async () => {
  const [
    [webSocket1, webSocket2, webSocket3],
    [received1, received2, received3],
  ] = await createClients(3);

  webSocket1.send('* from1To*');
  await pause(10);
  webSocket2.send('* from2To*');
  await pause(10);
  webSocket3.send('* from3To*');
  await pause(10);

  expect(received1.length).toBe(2);
  expect(received2.length).toBe(2);
  expect(received3.length).toBe(2);
  expect(received1[0][1]).toBe('from2To*');
  expect(received1[1][1]).toBe('from3To*');
  expect(received2[0][1]).toBe('from1To*');
  expect(received2[1][1]).toBe('from3To*');
  expect(received3[0][1]).toBe('from1To*');
  expect(received3[1][1]).toBe('from2To*');
  const client1Id = received2[0][0];
  const client2Id = received1[0][0];
  const client3Id = received1[1][0];

  webSocket1.send(client2Id + ' from1To2');
  webSocket1.send(client3Id + ' from1To3');
  await pause(10);
  webSocket2.send(client1Id + ' from2To1');
  webSocket2.send(client3Id + ' from2To3');
  await pause(10);
  webSocket3.send(client1Id + ' from3To1');
  webSocket3.send(client2Id + ' from3To2');
  await pause(10);
  webSocket1.send('foo undeliverable');
  webSocket2.send('bar undeliverable');
  webSocket3.send('baz undeliverable');
  await pause(10);

  expect(received1).toEqual([
    [client2Id, 'from2To*'],
    [client3Id, 'from3To*'],
    [client2Id, 'from2To1'],
    [client3Id, 'from3To1'],
  ]);
  expect(received2).toEqual([
    [client1Id, 'from1To*'],
    [client3Id, 'from3To*'],
    [client1Id, 'from1To2'],
    [client3Id, 'from3To2'],
  ]);
  expect(received3).toEqual([
    [client1Id, 'from1To*'],
    [client2Id, 'from2To*'],
    [client1Id, 'from1To3'],
    [client2Id, 'from2To3'],
  ]);
});
