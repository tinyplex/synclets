import type {
  createFileConnectors as createFileConnectorsDecl,
  createFileDataConnector as createFileDataConnectorDecl,
  createFileMetaConnector as createFileMetaConnectorDecl,
  FileDataConnector,
  FileMetaConnector,
} from '@synclets/@types/connector/fs';
import {createFileConnector} from './common.ts';

export const createFileConnectors: typeof createFileConnectorsDecl = <
  Depth extends number,
>(
  depth: Depth,
  file: string,
  {
    dataFile = file,
    metaFile = file,
  }: {dataFile?: string; metaFile?: string} = {},
) => [
  createFileDataConnector(depth, dataFile),
  createFileMetaConnector(depth, metaFile),
];

export const createFileDataConnector: typeof createFileDataConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
  file: string,
): FileDataConnector<Depth> => createFileConnector(false, depth, file);

export const createFileMetaConnector: typeof createFileMetaConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
  file: string,
): FileMetaConnector<Depth> => createFileConnector(true, depth, file);
