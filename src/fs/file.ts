import {createSynclet} from '@synclets';
import type {
  createFileDataConnector as createFileDataConnectorDecl,
  createFileMetaConnector as createFileMetaConnectorDecl,
  createFileSynclet as createFileSyncletDecl,
  FileDataConnector,
  FileDataConnectorOptions,
  FileMetaConnector,
  FileMetaConnectorOptions,
  FileSyncletOptions,
} from '@synclets/@types/fs';
import {createFileConnector} from './common.ts';

export const createFileDataConnector: typeof createFileDataConnectorDecl = <
  Depth extends number,
>({
  depth,
  dataFile,
}: FileDataConnectorOptions<Depth>): FileDataConnector<Depth> =>
  createFileConnector(false, depth, dataFile);

export const createFileMetaConnector: typeof createFileMetaConnectorDecl = <
  Depth extends number,
>({
  depth,
  metaFile,
}: FileMetaConnectorOptions<Depth>): FileMetaConnector<Depth> =>
  createFileConnector(true, depth, metaFile);

export const createFileSynclet: typeof createFileSyncletDecl = <
  Depth extends number,
>({
  depth,
  dataFile,
  metaFile,
  transport,
  implementations,
  id,
  logger,
}: FileSyncletOptions<Depth>) =>
  createSynclet(
    {
      dataConnector: createFileDataConnector({depth, dataFile}),
      metaConnector: createFileMetaConnector({depth, metaFile}),
      transport,
    },
    implementations,
    {id, logger},
  );
