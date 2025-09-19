/// connector/fs

import type {
  Address,
  Connector,
  ConnectorOptions,
  Context,
} from '../../index.js';

export interface DirectoryConnector extends Connector {
  getDirectory(): string;
}

export type DirectoryConnectorImplementations = {
  isParent: (
    address: Address,
    context: Context,
  ) => Promise<boolean | undefined>;
};

export type DirectoryConnectorOptions = ConnectorOptions & {
  directory: string;
};

export function createDirectoryConnector(
  implementations: DirectoryConnectorImplementations,
  options: DirectoryConnectorOptions,
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
