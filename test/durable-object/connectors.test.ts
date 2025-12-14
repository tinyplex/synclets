import {DurableObjectStub} from '@cloudflare/workers-types';
import type {Miniflare} from 'miniflare';
import {afterAll, beforeAll, expect, test} from 'vitest';
import {createMiniflare} from './common.ts';

const PORT = 8782;

let miniflare: Miniflare;
let stub: DurableObjectStub;
let host: string;

beforeAll(async () => {
  [miniflare, stub, host] = await createMiniflare(
    'TestConnectorsOnlyDurableObject',
    PORT,
  );
});

afterAll(async () => {
  await miniflare.dispose();
});

test('setAtom', async () => {
  expect(await (await stub.fetch(`${host}/getData`)).text()).toBe('{}');
  expect(await (await stub.fetch(`${host}/setAtom?[["a"],1]`)).text()).toBe('');
  expect(await (await stub.fetch(`${host}/getData`)).text()).toBe('{"a":1}');
});
