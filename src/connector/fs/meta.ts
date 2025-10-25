import type {
  createDirectoryMetaConnector as createDirectoryMetaConnectorDecl,
  createFileMetaConnector as createFileMetaConnectorDecl,
  DirectoryMetaConnector,
  FileMetaConnector,
} from '@synclets/@types/connector/fs';
import {createDirectoryConnector, createFileConnector} from './common.ts';

export const createFileMetaConnector: typeof createFileMetaConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
  file: string,
): FileMetaConnector<Depth> => createFileConnector(true, depth, file);

export const createDirectoryMetaConnector: typeof createDirectoryMetaConnectorDecl =
  <Depth extends number>(
    depth: Depth,
    directory: string,
  ): DirectoryMetaConnector<Depth> =>
    createDirectoryConnector(true, depth, directory);
