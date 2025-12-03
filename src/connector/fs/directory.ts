import {createSynclet} from '@synclets';
import type {
  createDirectoryDataConnector as createDirectoryDataConnectorDecl,
  createDirectoryMetaConnector as createDirectoryMetaConnectorDecl,
  createDirectorySynclet as createDirectorySyncletDecl,
  DirectoryDataConnector,
  DirectoryDataConnectorOptions,
  DirectoryMetaConnector,
  DirectoryMetaConnectorOptions,
  DirectorySyncletOptions,
} from '@synclets/@types/connector/fs';
import {createDirectoryConnector} from './common.ts';

export const createDirectoryDataConnector: typeof createDirectoryDataConnectorDecl =
  <Depth extends number>({
    depth,
    dataDirectory,
  }: DirectoryDataConnectorOptions<Depth>): DirectoryDataConnector<Depth> =>
    createDirectoryConnector(false, depth, dataDirectory);

export const createDirectoryMetaConnector: typeof createDirectoryMetaConnectorDecl =
  <Depth extends number>({
    depth,
    metaDirectory,
  }: DirectoryMetaConnectorOptions<Depth>): DirectoryMetaConnector<Depth> =>
    createDirectoryConnector(true, depth, metaDirectory);

export const createDirectorySynclet: typeof createDirectorySyncletDecl = <
  Depth extends number,
>({
  depth,
  dataDirectory,
  metaDirectory,
  transport,
  implementations,
  id,
  logger,
}: DirectorySyncletOptions<Depth>) =>
  createSynclet(
    {
      dataConnector: createDirectoryDataConnector({depth, dataDirectory}),
      metaConnector: createDirectoryMetaConnector({depth, metaDirectory}),
      transport,
    },
    implementations,
    {id, logger},
  );
