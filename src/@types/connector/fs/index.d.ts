/// connector/fs

import type {Connector, ConnectorOptions} from '../../index.js';

export interface DirectoryConnector extends Connector {
  getDirectory(): string;
}

export function createDirectoryConnector(
  atomDepth: number,
  directory: string,
  options?: ConnectorOptions,
): Promise<DirectoryConnector>;

// --

export interface FileConnector extends Connector {
  getFile(): string;
}

export function createFileConnector(
  atomDepth: number,
  file: string,
  options?: ConnectorOptions,
): Promise<FileConnector>;
