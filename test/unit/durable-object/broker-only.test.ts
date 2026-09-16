import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/memory';
import {createWsClientTransport} from 'synclets/ws';
import {expect} from 'vitest';
import {WebSocket} from 'ws';
import {allocatePort, describeCommonSyncletTests} from '../common.ts';
import {createMiniflare} from './miniflare/index.ts';

describeCommonSyncletTests(
  async () => {},
  async () => {},
  async () => {
    const [miniflare, fetch, api, port] = await createMiniflare(
      'TestBrokerOnlyDurableObject',
      allocatePort(),
    );
    await api('start');
    return [miniflare, fetch, api, port] as const;
  },
  async ([miniflare, , api]) => {
    try {
      expect(await api('getData')).toEqual({});
    } finally {
      // Dispose even when the assertion fails, or this Miniflare instance and
      // its workerd child process leak for the rest of the run.
      await miniflare.dispose();
    }
  },
  <Depth extends number>(depth: Depth) => createMemoryDataConnector({depth}),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector({depth}),
  (_: string, [, , , port]) =>
    createWsClientTransport({
      webSocket: new WebSocket('ws://localhost:' + port).setMaxListeners(0),
    }),
  5,
  undefined,
  undefined,
  ['pool'],
);
