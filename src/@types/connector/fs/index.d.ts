/// connector/fs

import type {Connector, ConnectorOptions} from '../../index.d.ts';

export interface DirectoryConnector extends Connector {
  getDirectory(): string;
}

export function createDirectoryConnector(
  depth: number,
  directory: string,
  options?: ConnectorOptions,
): Promise<DirectoryConnector>;

// --

export interface FileConnector extends Connector {
  getFile(): string;
}

export function createFileConnector(
  depth: number,
  file: string,
  options?: ConnectorOptions,
): Promise<FileConnector>;
