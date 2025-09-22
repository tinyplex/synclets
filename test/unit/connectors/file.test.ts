import {mkdtemp, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {Connector, ConnectorOptions} from 'synclets';
import {createFileConnector} from 'synclets/connector/fs';
import {getUniqueId} from 'synclets/utils';
import {describeConnectorTests} from '../common.ts';

let tmp: string;

beforeAll(async () => {
  tmp = await mkdtemp(tmpdir() + sep);
});

afterAll(async () => await rm(tmp, {recursive: true, force: true}));

test('file', async () => {
  const file = join(tmp, '42');
  const connector = await createFileConnector(1, file);
  expect(connector.getFile()).toBe(file);
});

describeConnectorTests(
  'file',
  (atomDepth: number, options: ConnectorOptions, {file}: {file: string}) =>
    createFileConnector(atomDepth, join(file, getUniqueId()), options),
  async (connector: Connector) => connector.getMeta(),
  async () => ({file: await mkdtemp(tmpdir() + sep)}),
  async ({file}: {file: string}) =>
    await rm(file, {recursive: true, force: true}),
);
