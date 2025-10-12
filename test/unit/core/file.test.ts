import {mkdtemp, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {createSynclet} from 'synclets';
import {
  createFileDataConnector,
  createFileMetaConnector,
} from 'synclets/connector/fs';
import {expect, test} from 'vitest';

test('getFile', async () => {
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
