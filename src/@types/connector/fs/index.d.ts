/// connector/fs

import type {
  Connectors,
  DataConnector,
  MetaConnector,
  Synclet,
  SyncletImplementations,
  SyncletOptions,
  Transport,
} from '../../index.d.ts';

/// FileDataConnector
export interface FileDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  /// FileDataConnector.getFile
  getFile(): string;
}

/// FileDataConnectorOptions
export type FileDataConnectorOptions<Depth extends number> = {
  /// FileDataConnectorOptions.depth
  depth: Depth;

  /// FileDataConnectorOptions.dataFile
  dataFile: string;
};

/// createFileDataConnector
export function createFileDataConnector<Depth extends number>(
  options: FileDataConnectorOptions<Depth>,
): FileDataConnector<Depth>;

/// FileMetaConnector
export interface FileMetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  /// FileMetaConnector.getFile
  getFile(): string;
}

/// FileMetaConnectorOptions
export type FileMetaConnectorOptions<Depth extends number> = {
  /// FileMetaConnectorOptions.depth
  depth: Depth;

  /// FileMetaConnectorOptions.metaFile
  metaFile: string;
};

/// createFileMetaConnector
export function createFileMetaConnector<Depth extends number>(
  options: FileMetaConnectorOptions<Depth>,
): FileMetaConnector<Depth>;

/// FileSyncletOptions
export type FileSyncletOptions<Depth extends number> =
  FileDataConnectorOptions<Depth> &
    FileMetaConnectorOptions<Depth> & {
      /// FileSyncletOptions.transport
      transport: Transport;

      /// FileSyncletOptions.implementations
      implementations?: SyncletImplementations<Depth>;
    } & SyncletOptions;

/// createFileSynclet
export function createFileSynclet<Depth extends number>(
  options: FileSyncletOptions<Depth>,
): Promise<Synclet<Depth, FileDataConnector<Depth>, FileMetaConnector<Depth>>>;

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
