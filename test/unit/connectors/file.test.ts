import {mkdtemp, readFile, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {Synclet} from 'synclets';
import {
  createFileDataConnector,
  createFileMetaConnector,
} from 'synclets/connector/fs';
import {getUniqueId} from 'synclets/utils';
import {describeConnectorTests} from '../common.ts';

test('file', async () => {
  const tmp = await mkdtemp(tmpdir() + sep);

  const dataFile = join(tmp, '42.data');
  const dataConnector = await createFileDataConnector(1, dataFile);
  expect(dataConnector.getFile()).toBe(dataFile);

  const metaFile = join(tmp, '42.meta');
  const metaConnector = await createFileDataConnector(1, metaFile);
  expect(metaConnector.getFile()).toBe(metaFile);

  await rm(tmp, {recursive: true, force: true});
});

describeConnectorTests(
  'file',
  <Depth extends number>(depth: Depth, {tempDir}: {tempDir: string}) =>
    createFileDataConnector(depth, join(tempDir, getUniqueId())),
  <Depth extends number>(depth: Depth, {tempDir}: {tempDir: string}) =>
    createFileMetaConnector(depth, join(tempDir, getUniqueId())),
  async (synclet: Synclet<number>) => {
    try {
      return JSON.parse(
        await readFile(synclet.getMetaConnector().getFile(), 'utf-8'),
      );
    } catch {}
    return {};
  },
  async () => ({tempDir: await mkdtemp(tmpdir() + sep)}),
  async ({tempDir}: {tempDir: string}) =>
    await rm(tempDir, {recursive: true, force: true}),
);
