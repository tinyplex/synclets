import {mkdtemp, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {createSynclet} from 'synclets';
import {
  createFileConnectors,
  createFileDataConnector,
  createFileMetaConnector,
} from 'synclets/connector/fs';
import {createMemoryTransport} from 'synclets/transport/memory';
import {getUniqueId} from 'synclets/utils';
import {expect, test} from 'vitest';
import {describeCommonConnectorTests} from '../common.ts';

describeCommonConnectorTests(
  async () => ({tempDir: await mkdtemp(tmpdir() + sep)}),
  async ({tempDir}) => await rm(tempDir, {recursive: true, force: true}),
  (depth: number, {tempDir}) =>
    createFileDataConnector(depth, join(tempDir, getUniqueId() + '.data')),
  (depth: number, {tempDir}) =>
    createFileMetaConnector(depth, join(tempDir, getUniqueId() + '.meta')),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);

test('getFile', async () => {
  const tmp = await mkdtemp(tmpdir() + sep);

  const dataFile = join(tmp, getUniqueId() + '.data');
  const dataConnector = createFileDataConnector(1, dataFile);

  const metaFile = join(tmp, getUniqueId() + '.meta');
  const metaConnector = createFileMetaConnector(1, metaFile);

  const synclet = await createSynclet({dataConnector, metaConnector});

  expect(dataConnector.getFile()).toEqual(dataFile);
  expect(synclet.getDataConnector().getFile()).toEqual(dataFile);
  expect(metaConnector.getFile()).toEqual(metaFile);
  expect(synclet.getMetaConnector().getFile()).toEqual(metaFile);

  await rm(tmp, {recursive: true, force: true});

  await synclet.destroy();
});

test('getFile, connectors', async () => {
  const tmp = await mkdtemp(tmpdir() + sep);

  const dataFile = join(tmp, getUniqueId() + '.data');
  const metaFile = join(tmp, getUniqueId() + '.meta');
  const connectors = createFileConnectors(1, tmp, {dataFile, metaFile});
  const synclet = await createSynclet({connectors});
  expect(connectors[0].getFile()).toEqual(dataFile);
  expect(synclet.getDataConnector().getFile()).toEqual(dataFile);
  expect(connectors[1].getFile()).toEqual(metaFile);
  expect(synclet.getMetaConnector().getFile()).toEqual(metaFile);

  await rm(tmp, {recursive: true, force: true});

  await synclet.destroy();
});
