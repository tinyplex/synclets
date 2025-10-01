/// connector/fs

import type {DataConnector, MetaConnector} from '../../index.d.ts';

export interface FileDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  getFile(): string;
}

export function createFileDataConnector<Depth extends number>(
  depth: Depth,
  file: string,
): Promise<FileDataConnector<Depth>>;

export interface FileMetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  getFile(): string;
}

export function createFileMetaConnector<Depth extends number>(
  depth: Depth,
  file: string,
): Promise<FileMetaConnector<Depth>>;

export interface DirectoryDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  getDirectory(): string;
}

export function createDirectoryDataConnector<Depth extends number>(
  depth: Depth,
  directory: string,
): Promise<DirectoryDataConnector<Depth>>;

export interface DirectoryMetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  getDirectory(): string;
}

export function createDirectoryMetaConnector<Depth extends number>(
  depth: Depth,
  directory: string,
): Promise<DirectoryMetaConnector<Depth>>;
