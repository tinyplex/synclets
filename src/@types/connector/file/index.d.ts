/// connector/file

import type {Connector, ConnectorOptions} from '../../index.d.ts';

export type FileConnectorOptions = ConnectorOptions & {
  directory: string;
};

export interface FileConnector extends Connector {
  getDirectory(): string;
}

export function createFileConnector(
  options: FileConnectorOptions,
): Promise<FileConnector>;
