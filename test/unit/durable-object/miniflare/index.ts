import {build} from 'esbuild';
import {Miniflare, RequestInit, Response} from 'miniflare';
import {fileURLToPath} from 'url';

export type Fetch = (path: string, init?: RequestInit) => Promise<Response>;
export type Api = (method: string, ...args: any[]) => Promise<string>;

const HOST = 'http://localhost';

const getScript = async (
  getName?: (request: Request) => string | undefined,
) => {
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

  return servers.replace('GET_NAME', getName?.toString() || 'undefined');
};

export const createMiniflare = async (
  className: string,
  port: number,
  getName?: (request: Request) => string | undefined,
): Promise<
  [
    Miniflare,
    (path: string, init?: RequestInit) => Promise<Response>,
    (path: string, ...args: any) => Promise<any>,
    port: number,
  ]
> => {
  const script = await getScript(getName);
  const miniflare = new Miniflare({
    port,
    script,
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
    port,
  ];
};
