import {mkdtemp, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {createSynclet} from 'synclets';
import {
  createFileDataConnector,
  createFileMetaConnector,
  createFileSynclet,
} from 'synclets/connector/fs';
import {createMemoryTransport} from 'synclets/transport/memory';
import {getUniqueId} from 'synclets/utils';
import {expect, test} from 'vitest';
import {describeCommonConnectorTests} from '../common.ts';

describeCommonConnectorTests(
  async () => ({tempDir: await mkdtemp(tmpdir() + sep)}),
  async ({tempDir}) => await rm(tempDir, {recursive: true, force: true}),
  (depth: number, {tempDir}) =>
    createFileDataConnector({
      depth,
      dataFile: join(tempDir, getUniqueId() + '.data'),
    }),
  (depth: number, {tempDir}) =>
    createFileMetaConnector({
      depth,
      metaFile: join(tempDir, getUniqueId() + '.meta'),
    }),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);

test('getFile', async () => {
  const tmp = await mkdtemp(tmpdir() + sep);

  const dataFile = join(tmp, getUniqueId() + '.data');
  const dataConnector = createFileDataConnector({depth: 1, dataFile});

  const metaFile = join(tmp, getUniqueId() + '.meta');
  const metaConnector = createFileMetaConnector({depth: 1, metaFile});

  const synclet = await createSynclet({dataConnector, metaConnector});

  expect(dataConnector.getFile()).toEqual(dataFile);
  expect(synclet.getDataConnector().getFile()).toEqual(dataFile);
  expect(metaConnector.getFile()).toEqual(metaFile);
  expect(synclet.getMetaConnector().getFile()).toEqual(metaFile);

  await rm(tmp, {recursive: true, force: true});

  await synclet.destroy();
});

test('getFile, createFileSynclet', async () => {
  const tmp = await mkdtemp(tmpdir() + sep);

  const dataFile = join(tmp, getUniqueId() + '.data');
  const metaFile = join(tmp, getUniqueId() + '.meta');
  const synclet = await createFileSynclet({
    depth: 1,
    dataFile,
    metaFile,
    transport: createMemoryTransport({poolId: getUniqueId()}),
  });
  expect(synclet.getDataConnector().getFile()).toEqual(dataFile);
  expect(synclet.getMetaConnector().getFile()).toEqual(metaFile);

  await rm(tmp, {recursive: true, force: true});

  await synclet.destroy();
});
