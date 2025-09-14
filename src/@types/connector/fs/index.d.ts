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

export type FileConnectorImplementations = {
  isParent: (
    address: Address,
    context: Context,
  ) => Promise<boolean | undefined>;
};

export type FileConnectorOptions = ConnectorOptions & {
  file: string;
};

export function createFileConnector(
  implementations: FileConnectorImplementations,
  options: FileConnectorOptions,
): Promise<FileConnector>;
