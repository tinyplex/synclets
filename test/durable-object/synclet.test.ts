import type {Miniflare} from 'miniflare';
import {afterAll, beforeAll, expect, test} from 'vitest';
import {createMiniflare} from './common.ts';

const PORT = 8780;

let miniflare: Miniflare;
let api: (path: string) => Promise<string>;
let fetch: (path: string, init?: RequestInit) => Promise<Response>;

beforeAll(async () => {
  [miniflare, api, fetch] = await createMiniflare(
    'TestSyncletDurableObject',
    PORT,
  );
});

afterAll(async () => {
  await miniflare.dispose();
});

test('return 501 for arbitrary requests', async () => {
  const response = await fetch('/');
  expect(response.status).toBe(501);
  expect(await response.text()).toBe('Not Implemented');
});

test('getData', async () => {
  expect(await api('getData')).toEqual({});
});

test('getMeta', async () => {
  expect(await api('getMeta')).toEqual({});
});

test('start/stop', async () => {
  expect(await api('isStarted')).toEqual(false);
  await api('start');
  expect(await api('isStarted')).toEqual(true);
  await api('stop');
  expect(await api('isStarted')).toEqual(false);
});
