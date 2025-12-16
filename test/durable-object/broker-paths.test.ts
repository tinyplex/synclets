import type {Miniflare} from 'miniflare';
import {getPartsFromPacket} from 'synclets/utils';
import {afterAll, beforeAll, expect, test} from 'vitest';
import {pause} from '../unit/common.ts';
import {createMiniflare} from './common.ts';

const PORT = 8782;

let miniflare: Miniflare;
let fetch: (path: string, init?: RequestInit) => Promise<Response>;

const createClient = async (path: string) => {
  const received: [string, string][] = [];
  const {webSocket} = await fetch(path, {
    headers: {upgrade: 'websocket'},
  });
  if (!webSocket) throw new Error('failed to obtain WebSocket from stub');
  webSocket.accept();
  webSocket.addEventListener('message', (event: any) =>
    received.push(getPartsFromPacket(event.data)),
  );
  return [webSocket, received] as const;
};

beforeAll(async () => {
  [miniflare, , fetch] = await createMiniflare(
    'TestBrokerOnlyDurableObject',
    PORT,
  );
});

afterAll(async () => {
  await miniflare.dispose();
});

test('clients on same path can communicate', async () => {
  const [webSocket1, received1] = await createClient('/room1');
  const [webSocket2, received2] = await createClient('/room1');

  webSocket1.send('* hello from client 1');
  await pause(10);

  expect(received2.length).toBe(1);
  expect(received2[0][1]).toBe('hello from client 1');

  const client1Id = received2[0][0];

  webSocket2.send(client1Id + ' hello back');
  await pause(10);

  expect(received1.length).toBe(1);
  expect(received1[0][1]).toBe('hello back');

  webSocket1.close();
  webSocket2.close();
});

test('clients on different paths cannot communicate', async () => {
  const [webSocket1, received1] = await createClient('/room1');
  const [webSocket2, received2] = await createClient('/room2');

  webSocket1.send('* hello from room1');
  webSocket2.send('* hello from room2');
  await pause(10);

  expect(received1).toEqual([]);
  expect(received2).toEqual([]);

  webSocket1.close();
  webSocket2.close();
});

test('3 clients across 2 paths communicate correctly', async () => {
  const [webSocket1a, received1a] = await createClient('/roomA');
  const [webSocket1b, received1b] = await createClient('/roomA');
  const [webSocket2, received2] = await createClient('/roomB');

  webSocket1a.send('* from 1a to roomA');
  await pause(10);

  expect(received1a).toEqual([]);
  expect(received1b.length).toBe(1);
  expect(received2).toEqual([]);
  expect(received1b[0][1]).toBe('from 1a to roomA');

  webSocket1b.send('* from 1b to roomA');
  await pause(10);

  expect(received1a.length).toBe(1);
  expect(received1b.length).toBe(1);
  expect(received2.length).toBe(0);
  expect(received1a[0][1]).toBe('from 1b to roomA');

  webSocket2.send('* from 2 to roomB');
  await pause(10);

  expect(received1a).toEqual([[received1a[0][0], 'from 1b to roomA']]);
  expect(received1b).toEqual([[received1b[0][0], 'from 1a to roomA']]);
  expect(received2).toEqual([]);

  webSocket1a.close();
  webSocket1b.close();
  webSocket2.close();
});

test('clients can send direct messages within same path', async () => {
  const [webSocket1, received1] = await createClient('/direct');
  const [webSocket2, received2] = await createClient('/direct');
  const [webSocket3, received3] = await createClient('/direct');

  webSocket1.send('* announce from 1');
  await pause(10);

  expect(received2.length).toBe(1);
  expect(received3.length).toBe(1);

  const client1Id = received2[0][0];
  const client2Id = received1[0][0];

  webSocket2.send(client1Id + ' direct to 1 from 2');
  await pause(10);

  expect(received1.length).toBe(2);
  expect(received1[1][1]).toBe('direct to 1 from 2');
  expect(received3.length).toBe(1);

  webSocket1.send(client2Id + ' direct to 2 from 1');
  await pause(10);

  expect(received2.length).toBe(2);
  expect(received2[1][1]).toBe('direct to 2 from 1');
  expect(received3.length).toBe(1);

  webSocket1.close();
  webSocket2.close();
  webSocket3.close();
});

test('empty path works as default room', async () => {
  const [webSocket1] = await createClient('/');
  const [webSocket2, received2] = await createClient('/');

  webSocket1.send('* hello in default room');
  await pause(10);

  expect(received2.length).toBe(1);
  expect(received2[0][1]).toBe('hello in default room');

  webSocket1.close();
  webSocket2.close();
});

test('paths with special characters are isolated', async () => {
  const [webSocket1, received1] = await createClient('/room/test');
  const [webSocket2, received2] = await createClient('/room-test');
  const [webSocket3, received3] = await createClient('/room');

  webSocket1.send('* from /room/test');
  webSocket2.send('* from /room-test');
  webSocket3.send('* from /room');
  await pause(10);

  expect(received1).toEqual([]);
  expect(received2).toEqual([]);
  expect(received3).toEqual([]);

  webSocket1.close();
  webSocket2.close();
  webSocket3.close();
});

test('broadcast to multiple clients on same path', async () => {
  const [webSocket1, received1] = await createClient('/broadcast');
  const [webSocket2, received2] = await createClient('/broadcast');
  const [webSocket3, received3] = await createClient('/broadcast');
  const [webSocket4, received4] = await createClient('/other');

  webSocket1.send('* broadcasting message');
  await pause(10);

  expect(received1).toEqual([]);
  expect(received2.length).toBe(1);
  expect(received3.length).toBe(1);
  expect(received4).toEqual([]);
  expect(received2[0][1]).toBe('broadcasting message');
  expect(received3[0][1]).toBe('broadcasting message');
  expect(received2[0][0]).toBe(received3[0][0]); // same sender ID

  webSocket1.close();
  webSocket2.close();
  webSocket3.close();
  webSocket4.close();
});

test('client leaves room, others continue', async () => {
  const [webSocket1] = await createClient('/leaving');
  const [webSocket2, received2] = await createClient('/leaving');
  const [webSocket3, received3] = await createClient('/leaving');

  webSocket1.send('* first message');
  await pause(10);

  expect(received2.length).toBe(1);
  expect(received3.length).toBe(1);
  expect(received2[0][1]).toBe('first message');
  expect(received3[0][1]).toBe('first message');

  webSocket2.close();
  await pause(10);

  webSocket1.send('* second message');
  await pause(10);

  expect(received3.length).toBe(2);
  expect(received3[1][1]).toBe('second message');
  expect(received2.length).toBe(1); // no new messages after close

  webSocket1.close();
  webSocket3.close();
});

test('connection rejected when does not match brokerPaths regex', async () => {
  const {webSocket} = await fetch('/invalid', {
    headers: {upgrade: 'websocket'},
  });
  if (!webSocket) throw new Error('failed to obtain WebSocket from stub');

  webSocket.accept();

  await new Promise((resolve) => {
    const timeout = setTimeout(() => resolve('timeout'), 1000);
    webSocket.addEventListener('close', () => {
      clearTimeout(timeout);
      resolve('close');
    });
  });

  expect(webSocket.readyState).toBe(WebSocket.CLOSED);
});
