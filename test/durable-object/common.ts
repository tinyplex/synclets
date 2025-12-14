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
  className: string,
  port: number,
): Promise<
  [
    Miniflare,
    (path: string, ...args: any) => Promise<any>,
    (path: string, init?: RequestInit) => Promise<Response>,
  ]
> => {
  const miniflare = new Miniflare({
    port,
    script: servers,
    modules: true,
    durableObjects: {testNamespace: {className, useSQLite: true}},
    compatibilityDate: '2025-12-02',
  });
  await miniflare.ready;

  const namespace = await miniflare.getDurableObjectNamespace('testNamespace');
  const stub: any = namespace.get(namespace.idFromName('testNamespace'));
  const api = stub.api.bind(stub);
  const fetch = (path: string, requestInfo?: RequestInit) =>
    stub.fetch(`${HOST}:${port}${path}`, requestInfo);

  return [miniflare, api, fetch];
};
