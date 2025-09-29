/// connector/fs

import type {DataConnector, MetaConnector} from '../../index.d.ts';

export interface FileDataConnector extends DataConnector {
  getFile(): string;
}

export function createFileDataConnector(
  depth: number,
  file: string,
): Promise<FileDataConnector>;

export interface FileMetaConnector extends MetaConnector {
  getFile(): string;
}

export function createFileMetaConnector(
  depth: number,
  file: string,
): Promise<FileMetaConnector>;
