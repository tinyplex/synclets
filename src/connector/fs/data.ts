import type {
  createDirectoryDataConnector as createDirectoryDataConnectorDecl,
  createFileDataConnector as createFileDataConnectorDecl,
  DirectoryDataConnector,
  FileDataConnector,
} from '@synclets/@types/connector/fs';
import {createDirectoryConnector, createFileConnector} from './common.ts';

export const createFileDataConnector: typeof createFileDataConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
  file: string,
): FileDataConnector<Depth> => createFileConnector(false, depth, file);

export const createDirectoryDataConnector: typeof createDirectoryDataConnectorDecl =
  <Depth extends number>(
    depth: Depth,
    directory: string,
  ): DirectoryDataConnector<Depth> =>
    createDirectoryConnector(false, depth, directory);
