import type {Miniflare} from 'miniflare';
import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {allocatePort, createClients, pause} from '../common.ts';
import {UPGRADE_HEADERS} from './common.ts';
import {createMiniflare} from './miniflare/index.ts';

const TRANSPORT_PAUSE = 5;

describe('hibernation detection', () => {
  let miniflare: Miniflare;
  let connect: (path: string) => Promise<{status: number; webSocket: any}>;
  let callApi: (method: string, ...args: any[]) => Promise<any>;

  beforeEach(async () => {
    const port = allocatePort();
    const miniFlareFetchApi = await createMiniflare(
      'TestHibernationDurableObject',
      port,
    );
    miniflare = miniFlareFetchApi[0];
    connect = async (path: string) =>
      await miniFlareFetchApi[1]('/' + path, UPGRADE_HEADERS);
    callApi = miniFlareFetchApi[2];
  });

  afterEach(async () => {
    await miniflare.dispose();
  });

  test('resumes from hibernation, 1 client', {timeout: 20000}, async () => {
    const [[ws1]] = await createClients(1, connect);

    await callApi('resetConstructorCount');
    expect(await callApi('getConstructorCount')).toEqual(1);
    expect(await callApi('getClientCount')).toBe(1);

    ws1.send('* 1');
    await pause(TRANSPORT_PAUSE);
    await pause(11000);
    ws1.send('* 2');
    await pause(TRANSPORT_PAUSE);

    expect(await callApi('getConstructorCount')).toEqual(2);
    expect(await callApi('getClientCount')).toBe(1);

    ws1.close();
  });

  test('resumes from hibernation, 2 clients', {timeout: 20000}, async () => {
    const [[ws1, ws2], [received1, received2]] = await createClients(
      2,
      connect,
    );

    await callApi('resetConstructorCount');
    expect(await callApi('getConstructorCount')).toEqual(1);
    expect(await callApi('getClientCount')).toBe(2);

    ws1.send('* from1To*1');
    ws2.send('* from2To*1');
    await pause(TRANSPORT_PAUSE);
    expect(received1.length).toEqual(1);
    expect(received2.length).toEqual(1);
    expect(received1[0][1]).toEqual('from2To*1');
    expect(received2[0][1]).toEqual('from1To*1');

    await pause(11000);

    ws1.send('* from1To*2');
    await pause(TRANSPORT_PAUSE);
    ws2.send('* from2To*2');
    await pause(TRANSPORT_PAUSE);
    expect(received1.length).toEqual(2);
    expect(received2.length).toEqual(2);
    expect(received1[1][1]).toEqual('from2To*2');
    expect(received2[1][1]).toEqual('from1To*2');

    expect(await callApi('getConstructorCount')).toEqual(2);
    expect(await callApi('getClientCount')).toBe(2);

    ws1.close();
    ws2.close();
  });
});
