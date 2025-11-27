import type {
  createDirectoryConnectors as createDirectoryConnectorsDecl,
  createFileConnectors as createFileConnectorsDecl,
} from '@synclets/@types/connector/fs';
import {createDirectoryDataConnector, createFileDataConnector} from './data.ts';
import {createDirectoryMetaConnector, createFileMetaConnector} from './meta.ts';

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

export const createDirectoryConnectors: typeof createDirectoryConnectorsDecl = <
  Depth extends number,
>(
  depth: Depth,
  directory: string,
  {
    dataDirectory = directory,
    metaDirectory = directory,
  }: {dataDirectory?: string; metaDirectory?: string} = {},
) => [
  createDirectoryDataConnector(depth, dataDirectory),
  createDirectoryMetaConnector(depth, metaDirectory),
];
