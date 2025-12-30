import type {Miniflare} from 'miniflare';
import {allocatePort, describeCommonBrokerTests} from '../common.ts';
import {createMiniflare} from './miniflare/index.ts';

let miniflare: Miniflare;

describeCommonBrokerTests(
  async () => {
    const miniFlareFetchApi = await createMiniflare(
      'TestSelectiveBrokerOnlyDurableObject',
      allocatePort(),
    );
    miniflare = miniFlareFetchApi[0];
    return [
      async (path: string) =>
        await miniFlareFetchApi[1]('/' + path, {
          headers: {upgrade: 'websocket'},
        }),
      async () => parseInt(await miniFlareFetchApi[2]('getClientCount')),
    ] as const;
  },
  async () => {
    await miniflare.dispose();
  },
);
