import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, sep} from 'node:path';
import {createSynclet} from 'synclets';
import {
  createDirectoryConnectors,
  createFileConnectors,
} from 'synclets/connector/fs';
import {getUniqueId} from 'synclets/utils';
import {describe, expect, test} from 'vitest';

describe('File and Directory Connectors', () => {
  test('createFileConnectors with single file', async () => {
    const file = join(tmpdir(), `synclets-test-${getUniqueId()}.json`);
    const connectors = createFileConnectors(1, file);

    const synclet = await createSynclet({connectors});

    expect(synclet.getDataConnector().getFile()).toEqual(file);
    expect(synclet.getMetaConnector().getFile()).toEqual(file);

    await synclet.setAtom(['test'], 'value');
    expect(await synclet.getData()).toEqual({test: 'value'});

    await synclet.destroy();
  });

  test('createFileConnectors with separate files', async () => {
    const dataFile = join(tmpdir(), `synclets-test-data-${getUniqueId()}.json`);
    const metaFile = join(tmpdir(), `synclets-test-meta-${getUniqueId()}.json`);

    const connectors = createFileConnectors(1, dataFile, {
      dataFile,
      metaFile,
    });

    const synclet = await createSynclet({connectors});

    expect(synclet.getDataConnector().getFile()).toEqual(dataFile);
    expect(synclet.getMetaConnector().getFile()).toEqual(metaFile);

    await synclet.setAtom(['test'], 'value');
    expect(await synclet.getData()).toEqual({test: 'value'});

    await synclet.destroy();
  });

  test('createDirectoryConnectors with single directory', async () => {
    const tmpDir = await mkdtemp(tmpdir() + sep);
    const directory = join(tmpDir, getUniqueId());
    // When using the same base directory, data and meta use different subdirs
    const connectors = createDirectoryConnectors(1, directory, {
      dataDirectory: join(directory, 'data'),
      metaDirectory: join(directory, 'meta'),
    });

    const synclet = await createSynclet({connectors});

    expect(synclet.getDataConnector().getDirectory()).toEqual(
      join(directory, 'data'),
    );
    expect(synclet.getMetaConnector().getDirectory()).toEqual(
      join(directory, 'meta'),
    );

    await synclet.setAtom(['test'], 'value');
    expect(await synclet.getData()).toEqual({test: 'value'});

    await synclet.destroy();
    await rm(tmpDir, {recursive: true, force: true});
  });

  test('createDirectoryConnectors with separate directories', async () => {
    const tmpDir = await mkdtemp(tmpdir() + sep);
    const dataDirectory = join(tmpDir, getUniqueId() + '.data');
    const metaDirectory = join(tmpDir, getUniqueId() + '.meta');

    const connectors = createDirectoryConnectors(1, dataDirectory, {
      dataDirectory,
      metaDirectory,
    });

    const synclet = await createSynclet({connectors});

    expect(synclet.getDataConnector().getDirectory()).toEqual(dataDirectory);
    expect(synclet.getMetaConnector().getDirectory()).toEqual(metaDirectory);

    await synclet.setAtom(['test'], 'value');
    expect(await synclet.getData()).toEqual({test: 'value'});

    await synclet.destroy();
    await rm(tmpDir, {recursive: true, force: true});
  });
});
