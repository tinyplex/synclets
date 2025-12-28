import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/memory';
import {createWsClientTransport} from 'synclets/ws';
import {WebSocket} from 'ws';
import {allocatePort, describeCommonSyncletTests} from '../common.ts';
import {createMiniflare} from './miniflare/index.ts';

const PORT = allocatePort();

describeCommonSyncletTests(
  async () => await createMiniflare('TestBrokerOnlyDurableObject', PORT),
  async ([miniflare]) => {
    await miniflare.dispose();
  },
  async () => {},
  async () => {},
  <Depth extends number>(depth: Depth) => createMemoryDataConnector({depth}),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector({depth}),
  (path: string) =>
    createWsClientTransport({
      webSocket: new WebSocket(
        'ws://localhost:' + PORT + '/' + path,
      ).setMaxListeners(0),
    }),
  10,
);
