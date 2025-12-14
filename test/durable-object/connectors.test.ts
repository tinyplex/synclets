import {DurableObjectStub} from '@cloudflare/workers-types';
import type {Miniflare} from 'miniflare';
import {afterAll, beforeAll, expect, test} from 'vitest';
import {createMiniflare} from './common.ts';

const HOST = 'http://localhost';

let miniflare: Miniflare;
let stub: DurableObjectStub;

beforeAll(async () => {
  [miniflare, stub] = await createMiniflare('TestConnectorsDurableObject');
});

afterAll(async () => {
  await miniflare.dispose();
});

test('return 426 for non-WebSocket requests', async () => {
  const response = await stub.fetch(HOST);
  expect(response.status).toBe(501);
  expect(await response.text()).toBe('Not Implemented');
});
