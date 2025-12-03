import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
import {fileURLToPath} from 'url';
import {afterAll, beforeAll, expect, test} from 'vitest';

let miniflare: Miniflare;
let stub: any;

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
  stub = namespace.get(namespace.idFromName('test'));
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
    headers: {
      upgrade: 'websocket',
      'sec-websocket-key': 'client-1',
    },
  });
  expect(response.status).toBe(101);
  expect(response.webSocket).toBeDefined();
});
