import {mkdtemp, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {createSynclet} from 'synclets';
import {
  createDirectoryDataConnector,
  createDirectoryMetaConnector,
} from 'synclets/connector/fs';
import {createMemoryTransport} from 'synclets/transport/memory';
import {getUniqueId} from 'synclets/utils';
import {expect, test} from 'vitest';
import {describeCommonConnectorTests} from '../common.ts';

describeCommonConnectorTests(
  async () => ({tempDir: await mkdtemp(tmpdir() + sep)}),
  async ({tempDir}: {tempDir: string}) =>
    await rm(tempDir, {recursive: true, force: true}),
  (depth: number, {tempDir}: {tempDir: string}) =>
    createDirectoryDataConnector(depth, join(tempDir, getUniqueId() + '.data')),
  (depth: number, {tempDir}: {tempDir: string}) =>
    createDirectoryMetaConnector(depth, join(tempDir, getUniqueId() + '.meta')),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);

test('getDirectory', async () => {
  const tmpDir = await mkdtemp(tmpdir() + sep);

  const dataDir = join(tmpDir, getUniqueId() + '.data');
  const dataConnector = createDirectoryDataConnector(1, dataDir);

  const metaDir = join(tmpDir, getUniqueId() + '.meta');
  const metaConnector = createDirectoryMetaConnector(1, metaDir);

  const synclet = await createSynclet({dataConnector, metaConnector});

  expect(dataConnector.getDirectory()).toEqual(dataDir);
  expect(synclet.getDataConnector().getDirectory()).toEqual(dataDir);
  expect(metaConnector.getDirectory()).toEqual(metaDir);
  expect(synclet.getMetaConnector().getDirectory()).toEqual(metaDir);

  await rm(tmpDir, {recursive: true, force: true});
});

test('non-path addresses', async () => {
  const tmpDir = await mkdtemp(tmpdir() + sep);

  const dataDir = join(tmpDir, getUniqueId() + '.data');
  const dataConnector = createDirectoryDataConnector(2, dataDir);

  const metaDir = join(tmpDir, getUniqueId() + '.meta');
  const metaConnector = createDirectoryMetaConnector(2, metaDir);

  const synclet = await createSynclet({dataConnector, metaConnector});
  await synclet.setAtom(['.', 'a/b'], 'A');
  await synclet.setAtom(['*', '/'], 'B');
  await synclet.setAtom(['~', '..'], 'B');

  expect(await synclet.getData()).toEqual({
    '.': {'a/b': 'A'},
    '*': {'/': 'B'},
    '~': {'..': 'B'},
  });

  await rm(tmpDir, {recursive: true, force: true});
});
