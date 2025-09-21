import {mkdtemp, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {createFileConnector} from 'synclets/connector/fs';

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
