import {mkdtemp, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {createSynclet} from 'synclets';
import {
  createDirectoryDataConnector,
  createDirectoryMetaConnector,
} from 'synclets/connector/fs';

test('directory', async () => {
  const tmp = await mkdtemp(tmpdir() + sep);

  const dataDir = join(tmp, '42.data');
  const dataConnector = createDirectoryDataConnector(1, dataDir);

  const metaDir = join(tmp, '42.meta');
  const metaConnector = createDirectoryMetaConnector(1, metaDir);

  const synclet = await createSynclet({dataConnector, metaConnector});

  expect(dataConnector.getDirectory()).toBe(dataDir);
  expect(synclet.getDataConnector().getDirectory()).toBe(dataDir);
  expect(metaConnector.getDirectory()).toBe(metaDir);
  expect(synclet.getMetaConnector().getDirectory()).toBe(metaDir);

  await rm(tmp, {recursive: true, force: true});
});
