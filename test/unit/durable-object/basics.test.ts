import {type Miniflare} from 'miniflare';
import {afterAll, beforeAll, expect, test} from 'vitest';
import {allocatePort} from '../common.ts';
import {Api, createMiniflare, Fetch} from './miniflare/index.ts';

const PORT = allocatePort();

let miniflare: Miniflare;
let fetch: Fetch;
let api: Api;

beforeAll(async () => {
  [miniflare, fetch, api] = await createMiniflare(
    'TestSyncletDurableObject',
    PORT,
  );
});

afterAll(async () => {
  await miniflare.dispose();
});

test('return 501 for POST', async () => {
  const response = await fetch('/', {method: 'POST'});
  expect(response.status).toBe(501);
  expect(await response.text()).toBe('Not Implemented');
});

test('return 426 for GET', async () => {
  const response = await fetch('/', {method: 'GET'});
  expect(response.status).toBe(426);
  expect(await response.text()).toBe('Upgrade Required');
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
