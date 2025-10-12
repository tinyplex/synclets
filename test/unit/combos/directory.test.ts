import {mkdtemp, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {
  createDirectoryDataConnector,
  createDirectoryMetaConnector,
} from 'synclets/connector/fs';
import {createStatelessWsServer} from 'synclets/server/stateless-ws';
import {createMemoryTransport} from 'synclets/transport/memory';
import {createWsTransport} from 'synclets/transport/ws';
import {getUniqueId} from 'synclets/utils';
import {WebSocketServer} from 'ws';
import {describeSyncletTests} from '../common.ts';

const WS_PORT = 9002;

describeSyncletTests(
  'directory over memory',
  async () => ({tempDir: await mkdtemp(tmpdir() + sep)}),
  async ({tempDir}: {tempDir: string}) =>
    await rm(tempDir, {recursive: true, force: true}),
  (depth: number, {tempDir}: {tempDir: string}) =>
    createDirectoryDataConnector(depth, join(tempDir, getUniqueId() + '.data')),
  (depth: number, {tempDir}: {tempDir: string}) =>
    createDirectoryMetaConnector(depth, join(tempDir, getUniqueId() + '.meta')),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);

describeSyncletTests(
  'directory over ws',
  async () => ({
    tempDir: await mkdtemp(tmpdir() + sep),
    wsServer: createStatelessWsServer(new WebSocketServer({port: WS_PORT})),
  }),
  async ({tempDir, wsServer}) => {
    await rm(tempDir, {recursive: true, force: true});
    wsServer.destroy();
  },
  (depth: number, {tempDir}) =>
    createDirectoryDataConnector(depth, join(tempDir, getUniqueId())),
  (depth: number, {tempDir}) =>
    createDirectoryMetaConnector(depth, join(tempDir, getUniqueId())),
  (uniqueId: string) =>
    createWsTransport(
      new WebSocket('ws://localhost:' + WS_PORT + '/' + uniqueId),
    ),
  5,
);
