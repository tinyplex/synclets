import {mkdtemp, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {ConnectorOptions, Synclet} from 'synclets';
import {
  createFileDataConnector,
  createFileMetaConnector,
} from 'synclets/connector/fs';
import {getUniqueId} from 'synclets/utils';
import {describeConnectorTests} from '../common.ts';

let tmp: string;

beforeAll(async () => {
  tmp = await mkdtemp(tmpdir() + sep);
});

afterAll(async () => await rm(tmp, {recursive: true, force: true}));

test('file', async () => {
  const dataFile = join(tmp, '42.data');
  const dataConnector = await createFileDataConnector(1, dataFile);
  expect(dataConnector.getFile()).toBe(dataFile);

  const metaFile = join(tmp, '42.meta');
  const metaConnector = await createFileDataConnector(1, metaFile);
  expect(metaConnector.getFile()).toBe(metaFile);
});

describeConnectorTests(
  'file',
  (depth: number, options: ConnectorOptions, {file}: {file: string}) =>
    createFileDataConnector(depth, join(file, getUniqueId()), options),
  (depth: number, options: ConnectorOptions, {file}: {file: string}) =>
    createFileMetaConnector(depth, join(file, getUniqueId()), options),
  (synclet: Synclet) => synclet.getMeta(),
  async () => ({file: await mkdtemp(tmpdir() + sep)}),
  async ({file}: {file: string}) =>
    await rm(file, {recursive: true, force: true}),
);
