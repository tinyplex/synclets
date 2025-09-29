/// connector/fs

import type {
  ConnectorOptions,
  DataConnector,
  MetaConnector,
} from '../../index.d.ts';

export interface FileDataConnector extends DataConnector {
  getFile(): string;
}

export function createFileDataConnector(
  depth: number,
  file: string,
  options?: ConnectorOptions,
): Promise<FileDataConnector>;

export interface FileMetaConnector extends MetaConnector {
  getFile(): string;
}

export function createFileMetaConnector(
  depth: number,
  file: string,
  options?: ConnectorOptions,
): Promise<FileMetaConnector>;
