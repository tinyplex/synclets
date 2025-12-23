import {build} from 'esbuild';
import {Miniflare, RequestInit, Response} from 'miniflare';
import {fileURLToPath} from 'url';

export type Fetch = (path: string, init?: RequestInit) => Promise<Response>;
export type Api = (method: string, ...args: any[]) => Promise<string>;

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
    (path: string, init?: RequestInit) => Promise<Response>,
    (path: string, ...args: any) => Promise<any>,
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

  const {fetch} = await miniflare.getWorker();

  return [
    miniflare,
    async (path: string, init?: RequestInit) => {
      return await fetch(new URL(path, `${HOST}:${port}`), init);
    },
    async (method: string, ...args: any) =>
      await (
        await fetch(
          new URL(
            `/api/${method}?${encodeURIComponent(JSON.stringify(args))}`,
            `${HOST}:${port}`,
          ),
          {headers: {upgrade: 'websocket'}},
        )
      ).json(),
  ];
};
