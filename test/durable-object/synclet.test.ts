import {DurableObjectStub} from '@cloudflare/workers-types';
import type {Miniflare} from 'miniflare';
import {afterAll, beforeAll, expect, test} from 'vitest';
import {createMiniflare} from './common.ts';

const PORT = 8780;

let miniflare: Miniflare;
let stub: DurableObjectStub;
let host: string;

beforeAll(async () => {
  [miniflare, stub, host] = await createMiniflare(
    'TestSyncletDurableObject',
    PORT,
  );
});

afterAll(async () => {
  await miniflare.dispose();
});

test('return 501 for arbitrary requests', async () => {
  const response = await stub.fetch(host);
  expect(response.status).toBe(501);
  expect(await response.text()).toBe('Not Implemented');
});

test('getData', async () => {
  const response = await stub.fetch(`${host}/getData`);
  expect(response.status).toBe(200);
  expect(await response.text()).toBe('{}');
});

test('getMeta', async () => {
  const response = await stub.fetch(`${host}/getMeta`);
  expect(response.status).toBe(200);
  expect(await response.text()).toBe('{}');
});

test('start/stop', async () => {
  expect(await (await stub.fetch(`${host}/isStarted`)).text()).toBe('false');
  expect(await (await stub.fetch(`${host}/start`)).text()).toBe('');
  expect(await (await stub.fetch(`${host}/isStarted`)).text()).toBe('true');
  expect(await (await stub.fetch(`${host}/stop`)).text()).toBe('');
  expect(await (await stub.fetch(`${host}/isStarted`)).text()).toBe('false');
});
