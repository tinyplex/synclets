import type {
  createDirectoryConnectors as createDirectoryConnectorsDecl,
  createDirectoryDataConnector as createDirectoryDataConnectorDecl,
  createDirectoryMetaConnector as createDirectoryMetaConnectorDecl,
  DirectoryDataConnector,
  DirectoryMetaConnector,
} from '@synclets/@types/connector/fs';
import {createDirectoryConnector} from './common.ts';

export const createDirectoryConnectors: typeof createDirectoryConnectorsDecl = <
  Depth extends number,
>(
  depth: Depth,
  dataDirectory: string,
  metaDirectory: string,
) => {
  const dataConnector = createDirectoryDataConnector(depth, dataDirectory);
  const metaConnector = createDirectoryMetaConnector(depth, metaDirectory);
  return {
    getDataConnector: () => dataConnector,
    getMetaConnector: () => metaConnector,
  };
};

export const createDirectoryDataConnector: typeof createDirectoryDataConnectorDecl =
  <Depth extends number>(
    depth: Depth,
    directory: string,
  ): DirectoryDataConnector<Depth> =>
    createDirectoryConnector(false, depth, directory);

export const createDirectoryMetaConnector: typeof createDirectoryMetaConnectorDecl =
  <Depth extends number>(
    depth: Depth,
    directory: string,
  ): DirectoryMetaConnector<Depth> =>
    createDirectoryConnector(true, depth, directory);
