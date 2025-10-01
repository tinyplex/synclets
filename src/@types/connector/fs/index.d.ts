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
