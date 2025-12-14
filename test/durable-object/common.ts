import {DurableObjectStub} from '@cloudflare/workers-types';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
import {fileURLToPath} from 'url';

const {
  outputFiles: [{text: servers}],
} = await build({
  entryPoints: [fileURLToPath(new URL('./servers.ts', import.meta.url))],
  write: false,
  bundle: true,
  format: 'esm',
  target: ['es2020'],
  external: ['cloudflare:workers'],
});

const HOST = 'http://localhost';

export const createMiniflare = async (
  durableObjectClass: string,
  port: number,
): Promise<[Miniflare, DurableObjectStub, string]> => {
  const miniflare = new Miniflare({
    port,
    script: servers,
    modules: true,
    durableObjects: {testNamespace: durableObjectClass},
    compatibilityDate: '2025-12-02',
  });
  await miniflare.ready;

  const namespace = await miniflare.getDurableObjectNamespace('testNamespace');
  const stub: any = namespace.get(namespace.idFromName('testNamespace'));

  return [miniflare, stub, HOST + `:${port}`];
};
