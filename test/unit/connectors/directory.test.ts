import {mkdtemp, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {Synclet} from 'synclets';
import {
  createDirectoryDataConnector,
  createDirectoryMetaConnector,
} from 'synclets/connector/fs';
import {getUniqueId} from 'synclets/utils';
import {describeConnectorTests} from '../common.ts';

test('directory', async () => {
  const tmp = await mkdtemp(tmpdir() + sep);

  const dataDir = join(tmp, '42.data');
  const dataConnector = await createDirectoryDataConnector(1, dataDir);
  expect(dataConnector.getDirectory()).toBe(dataDir);

  const metaDir = join(tmp, '42.meta');
  const metaConnector = await createDirectoryMetaConnector(1, metaDir);
  expect(metaConnector.getDirectory()).toBe(metaDir);

  await rm(tmp, {recursive: true, force: true});
});

describeConnectorTests(
  'directory',
  <Depth extends number>(depth: Depth, {file}: {file: string}) =>
    createDirectoryDataConnector(depth, join(file, getUniqueId())),
  <Depth extends number>(depth: Depth, {file}: {file: string}) =>
    createDirectoryMetaConnector(depth, join(file, getUniqueId())),
  (synclet: Synclet<number>) => synclet.getMeta(),
  async () => ({file: await mkdtemp(tmpdir() + sep)}),
  async ({file}: {file: string}) =>
    await rm(file, {recursive: true, force: true}),
);
