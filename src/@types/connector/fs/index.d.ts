/// connector/fs

import type {DataConnector, MetaConnector} from '../../index.d.ts';

/// FileDataConnector
export interface FileDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  getFile(): string;
}

/// createFileDataConnector
export function createFileDataConnector<Depth extends number>(
  depth: Depth,
  file: string,
): FileDataConnector<Depth>;

/// FileMetaConnector
export interface FileMetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  getFile(): string;
}

/// createFileMetaConnector
export function createFileMetaConnector<Depth extends number>(
  depth: Depth,
  file: string,
): FileMetaConnector<Depth>;

/// DirectoryDataConnector
export interface DirectoryDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  getDirectory(): string;
}

/// createDirectoryDataConnector
export function createDirectoryDataConnector<Depth extends number>(
  depth: Depth,
  directory: string,
): DirectoryDataConnector<Depth>;

/// DirectoryMetaConnector
export interface DirectoryMetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  getDirectory(): string;
}

/// createDirectoryMetaConnector
export function createDirectoryMetaConnector<Depth extends number>(
  depth: Depth,
  directory: string,
): DirectoryMetaConnector<Depth>;
