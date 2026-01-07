import type {Miniflare} from 'miniflare';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {
  allocatePort,
  createClients,
  describeCommonBrokerTests,
  pause,
} from '../common.ts';
import {createMiniflare} from './miniflare/index.ts';

let miniflare: Miniflare;

describeCommonBrokerTests(
  async () => {
    const miniFlareFetchApi = await createMiniflare(
      'TestSelectiveBrokerOnlyDurableObject',
      allocatePort(),
    );
    miniflare = miniFlareFetchApi[0];
    return [
      async (path: string) =>
        await miniFlareFetchApi[1]('/' + path, {
          headers: {upgrade: 'websocket'},
        }),
      async () => await miniFlareFetchApi[2]('getClientIds'),
    ] as const;
  },
  async () => {
    await miniflare.dispose();
  },
);

describe('two DO instances, two paths', () => {
  const transportPause = 5;
  let miniflare: Miniflare;
  let port: number;
  let connect: (path: string, init?: any) => Promise<any>;

  beforeEach(async () => {
    port = allocatePort();
    const miniFlareFetchApi = await createMiniflare(
      'TestSelectiveBrokerOnlyDurableObject',
      port,
      (request) => new URL(request.url).pathname,
    );
    miniflare = miniFlareFetchApi[0];
    connect = miniFlareFetchApi[1];
  });

  afterEach(async () => {
    await miniflare.dispose();
  });

  test('two DOs provide isolation between paths', async () => {
    const [[ws1p1, ws2p1], [received1p1, received2p1]] = await createClients(
      2,
      (path: string) => connect('/' + path, {headers: {upgrade: 'websocket'}}),
      () => 'p1',
    );

    const [[ws1p2, ws2p2], [received1p2, received2p2]] = await createClients(
      2,
      (path: string) => connect('/' + path, {headers: {upgrade: 'websocket'}}),
      () => 'p2',
    );

    await pause(transportPause);

    ws1p1.send('* from1p1To*');
    await pause(transportPause);
    ws2p1.send('* from2p1To*');
    await pause(transportPause);

    expect(received1p1.length).toEqual(1);
    expect(received1p1[0][1]).toEqual('from2p1To*');
    expect(received2p1.length).toEqual(1);
    expect(received2p1[0][1]).toEqual('from1p1To*');
    expect(received1p2.length).toEqual(0);
    expect(received2p2.length).toEqual(0);

    ws1p2.send('* from1p2To*');
    await pause(transportPause);
    ws2p2.send('* from2p2To*');
    await pause(transportPause);

    expect(received1p1.length).toEqual(1);
    expect(received2p1.length).toEqual(1);
    expect(received1p2.length).toEqual(1);
    expect(received1p2[0][1]).toEqual('from2p2To*');
    expect(received2p2.length).toEqual(1);
    expect(received2p2[0][1]).toEqual('from1p2To*');

    ws1p1.close();
    ws2p1.close();
    ws1p2.close();
    ws2p2.close();
  });
});
