import {createDataConnector, createMetaConnector} from '@synclets';
import type {
  createDirectoryDataConnector as createDirectoryDataConnectorDecl,
  createDirectoryMetaConnector as createDirectoryMetaConnectorDecl,
  DirectoryDataConnector,
  DirectoryMetaConnector,
} from '@synclets/@types/connector/fs';
import {validateDirectory} from '../../common/fs.ts';

export const createDirectoryDataConnector: typeof createDirectoryDataConnectorDecl =
  async <Depth extends number>(
    depth: Depth,
    path: string,
  ): Promise<DirectoryDataConnector<Depth>> => {
    const directory = await validateDirectory(path);

    const readAtom = {
      // TODO
    };

    const writeAtom = {
      // TODO
    };

    const removeAtom = {
      // TODO
    };

    const readChildIds = {
      // TODO
    };

    const readAtoms = {
      // TODO
    };

    const dataConnector = await createDataConnector(depth, {
      readAtom,
      writeAtom,
      removeAtom,
      readChildIds,
      readAtoms,
    });

    return {
      ...dataConnector,
      getDirectory: () => directory,
    };
  };

export const createDirectoryMetaConnector: typeof createDirectoryMetaConnectorDecl =
  async <Depth extends number>(
    depth: Depth,
    path: string,
  ): Promise<DirectoryMetaConnector<Depth>> => {
    const directory = await validateDirectory(path);

    const readTimestamp = {
      // TODO
    };

    const writeTimestamp = {
      // TODO
    };

    const readChildIds = {
      // TODO
    };

    const readTimestamps = {
      // TODO
    };

    const metaConnector = await createMetaConnector(depth, {
      readTimestamp,
      writeTimestamp,
      readChildIds,
      readTimestamps,
    });

    return {
      ...metaConnector
      getDirectory: () => directory,
    };
  };
