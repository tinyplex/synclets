import {mkdtemp, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {createSynclet} from 'synclets';
import {
  createDirectoryDataConnector,
  createDirectoryMetaConnector,
} from 'synclets/connector/fs';
import {getUniqueId} from 'synclets/utils';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(tmpdir() + sep);
});

afterEach(async () => {
  await rm(tmpDir, {recursive: true, force: true});
});

test('getDirectory', async () => {
  const dataDir = join(tmpDir, getUniqueId() + '.data');
  const dataConnector = createDirectoryDataConnector(1, dataDir);

  const metaDir = join(tmpDir, getUniqueId() + '.meta');
  const metaConnector = createDirectoryMetaConnector(1, metaDir);

  const synclet = await createSynclet({dataConnector, metaConnector});

  expect(dataConnector.getDirectory()).toBe(dataDir);
  expect(synclet.getDataConnector().getDirectory()).toBe(dataDir);
  expect(metaConnector.getDirectory()).toBe(metaDir);
  expect(synclet.getMetaConnector().getDirectory()).toBe(metaDir);
});

test('non-path addresses', async () => {
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
});
