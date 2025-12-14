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

export const createMiniflare = async (
  durableObjects: Record<string, string>,
): Promise<Miniflare> => {
  const miniflare = new Miniflare({
    script: servers,
    modules: true,
    durableObjects,
    compatibilityDate: '2025-12-02',
  });
  await miniflare.ready;
  return miniflare;
};
