/// connector/file

import type {ConnectorOptions} from '../../index.d.ts';
import type {BaseValueConnector} from '../base/index.d.ts';

export type FileConnectorOptions = ConnectorOptions & {
  directory: string;
};

export interface FileValueConnector extends BaseValueConnector {
  getDirectory(): string;
}

export function createFileValueConnector(
  options: FileConnectorOptions,
): Promise<FileValueConnector>;
