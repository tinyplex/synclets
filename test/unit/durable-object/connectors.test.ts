import type {Miniflare} from 'miniflare';
import {afterAll, beforeAll, expect, test} from 'vitest';
import {allocatePort} from '../common.ts';
import {Api, createMiniflare} from './miniflare/index.ts';

const PORT = allocatePort();

let miniflare: Miniflare;
let api: Api;

beforeAll(async () => {
  [miniflare, , api] = await createMiniflare(
    'TestConnectorsOnlyDurableObject',
    PORT,
  );
});

afterAll(async () => {
  await miniflare.dispose();
});

test('setAtom', async () => {
  expect(await api('getData')).toEqual({});
  await api('setAtom', ['a'], 'a');
  expect(await api('getData')).toEqual({a: 'a'});
  await api('setAtom', ['b'], true);
  expect(await api('getData')).toEqual({a: 'a', b: true});
  await api('setAtom', ['c'], 1);
  expect(await api('getData')).toEqual({a: 'a', b: true, c: 1});
});
