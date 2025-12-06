import {mkdtemp, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {createSynclet} from 'synclets';
import {
  createDirectoryDataConnector,
  createDirectoryMetaConnector,
  createDirectorySynclet,
} from 'synclets/fs';
import {createMemoryTransport} from 'synclets/memory';
import {getUniqueId} from 'synclets/utils';
import {expect, test} from 'vitest';
import {describeCommonConnectorTests} from '../common.ts';

describeCommonConnectorTests(
  async () => ({tempDir: await mkdtemp(tmpdir() + sep)}),
  async ({tempDir}: {tempDir: string}) =>
    await rm(tempDir, {recursive: true, force: true}),
  (depth: number, {tempDir}: {tempDir: string}) =>
    createDirectoryDataConnector({
      depth,
      dataDirectory: join(tempDir, getUniqueId() + '.data'),
    }),
  (depth: number, {tempDir}: {tempDir: string}) =>
    createDirectoryMetaConnector({
      depth,
      metaDirectory: join(tempDir, getUniqueId() + '.meta'),
    }),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);

test('getDirectory', async () => {
  const tmpDir = await mkdtemp(tmpdir() + sep);

  const dataDir = join(tmpDir, getUniqueId() + '.data');
  const dataConnector = createDirectoryDataConnector({
    depth: 1,
    dataDirectory: dataDir,
  });

  const metaDir = join(tmpDir, getUniqueId() + '.meta');
  const metaConnector = createDirectoryMetaConnector({
    depth: 1,
    metaDirectory: metaDir,
  });

  const synclet = await createSynclet({dataConnector, metaConnector});

  expect(dataConnector.getDirectory()).toEqual(dataDir);
  expect(synclet.getDataConnector()!.getDirectory()).toEqual(dataDir);
  expect(metaConnector.getDirectory()).toEqual(metaDir);
  expect(synclet.getMetaConnector()!.getDirectory()).toEqual(metaDir);

  await rm(tmpDir, {recursive: true, force: true});

  await synclet.destroy();
});

test('getDirectory, createDirectorySynclet', async () => {
  const tmpDir = await mkdtemp(tmpdir() + sep);

  const dataDirectory = join(tmpDir, getUniqueId() + '.data');
  const metaDirectory = join(tmpDir, getUniqueId() + '.meta');
  const synclet = await createDirectorySynclet({
    depth: 1,
    dataDirectory,
    metaDirectory,
    transport: createMemoryTransport({poolId: getUniqueId()}),
  });

  expect(synclet.getDataConnector()!.getDirectory()).toEqual(dataDirectory);
  expect(synclet.getMetaConnector()!.getDirectory()).toEqual(metaDirectory);

  await rm(tmpDir, {recursive: true, force: true});

  await synclet.destroy();
});

test('non-path addresses', async () => {
  const tmpDir = await mkdtemp(tmpdir() + sep);

  const dataDir = join(tmpDir, getUniqueId() + '.data');
  const dataConnector = createDirectoryDataConnector({
    depth: 2,
    dataDirectory: dataDir,
  });

  const metaDir = join(tmpDir, getUniqueId() + '.meta');
  const metaConnector = createDirectoryMetaConnector({
    depth: 2,
    metaDirectory: metaDir,
  });

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

  await synclet.destroy();
});
