import {mkdtemp, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {createSynclet} from 'synclets';
import {
  createDirectoryDataConnector,
  createDirectoryMetaConnector,
} from 'synclets/connector/fs';
import {getUniqueId} from 'synclets/utils';
import {describeConnectorTests} from '../common.ts';

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

describeConnectorTests(
  'directory',
  async () => ({file: await mkdtemp(tmpdir() + sep)}),
  async ({file}: {file: string}) =>
    await rm(file, {recursive: true, force: true}),
  (depth: number, {file}: {file: string}) =>
    createDirectoryDataConnector(depth, join(file, getUniqueId())),
  (depth: number, {file}: {file: string}) =>
    createDirectoryMetaConnector(depth, join(file, getUniqueId())),
);
