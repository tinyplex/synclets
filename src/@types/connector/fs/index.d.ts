/// connector/fs

import type {Connectors, DataConnector, MetaConnector} from '../../index.d.ts';

/// FileDataConnector
export interface FileDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  /// FileDataConnector.getFile
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
  /// FileMetaConnector.getFile
  getFile(): string;
}

/// createFileMetaConnector
export function createFileMetaConnector<Depth extends number>(
  depth: Depth,
  file: string,
): FileMetaConnector<Depth>;

/// FileConnectorsOptions
export type FileConnectorsOptions = {
  /// FileConnectorsOptions.dataFile
  dataFile?: string;

  /// FileConnectorsOptions.metaFile
  metaFile?: string;
};

/// createFileConnectors
export function createFileConnectors<Depth extends number>(
  depth: Depth,
  file: string,
  options?: FileConnectorsOptions,
): Connectors<Depth, FileDataConnector<Depth>, FileMetaConnector<Depth>>;

/// DirectoryDataConnector
export interface DirectoryDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  /// DirectoryDataConnector.getDirectory
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
  /// DirectoryMetaConnector.getDirectory
  getDirectory(): string;
}

/// createDirectoryMetaConnector
export function createDirectoryMetaConnector<Depth extends number>(
  depth: Depth,
  directory: string,
): DirectoryMetaConnector<Depth>;

/// createDirectoryConnectors
export function createDirectoryConnectors<Depth extends number>(
  depth: Depth,
  dataDirectory: string,
  metaDirectory: string,
): Connectors<
  Depth,
  DirectoryDataConnector<Depth>,
  DirectoryMetaConnector<Depth>
>;
