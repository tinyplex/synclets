import {mkdtemp, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {createSynclet} from 'synclets';
import {
  createFileDataConnector,
  createFileMetaConnector,
} from 'synclets/connector/fs';
import {createWsServer} from 'synclets/server/ws';
import {createMemoryTransport} from 'synclets/transport/memory';
import {createWsTransport} from 'synclets/transport/ws';
import {getUniqueId} from 'synclets/utils';
import {WebSocketServer} from 'ws';
import {describeConnectorTests} from '../common.ts';

test('file', async () => {
  const tmp = await mkdtemp(tmpdir() + sep);

  const dataFile = join(tmp, '42.data');
  const dataConnector = createFileDataConnector(1, dataFile);

  const metaFile = join(tmp, '42.meta');
  const metaConnector = createFileMetaConnector(1, metaFile);

  const synclet = await createSynclet({dataConnector, metaConnector});

  expect(dataConnector.getFile()).toBe(dataFile);
  expect(synclet.getDataConnector().getFile()).toBe(dataFile);
  expect(metaConnector.getFile()).toBe(metaFile);
  expect(synclet.getMetaConnector().getFile()).toBe(metaFile);

  await rm(tmp, {recursive: true, force: true});
});

describeConnectorTests(
  'file over memory',
  async () => ({tempDir: await mkdtemp(tmpdir() + sep)}),
  async ({tempDir}) => await rm(tempDir, {recursive: true, force: true}),
  (depth: number, {tempDir}) =>
    createFileDataConnector(depth, join(tempDir, getUniqueId())),
  (depth: number, {tempDir}) =>
    createFileMetaConnector(depth, join(tempDir, getUniqueId())),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);

describeConnectorTests(
  'file over ws',
  async () => ({
    tempDir: await mkdtemp(tmpdir() + sep),
    wsServer: createWsServer(new WebSocketServer({port: 9000})),
  }),
  async ({tempDir, wsServer}) => {
    await rm(tempDir, {recursive: true, force: true});
    wsServer.destroy();
  },
  (depth: number, {tempDir}) =>
    createFileDataConnector(depth, join(tempDir, getUniqueId())),
  (depth: number, {tempDir}) =>
    createFileMetaConnector(depth, join(tempDir, getUniqueId())),
  (uniqueId: string) =>
    createWsTransport(new WebSocket('ws://localhost:9000/' + uniqueId)),
  5,
);
