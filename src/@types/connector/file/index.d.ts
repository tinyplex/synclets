/// connector/file

import type {ConnectorOptions} from '../../index.d.ts';
import type {BaseValueConnector} from '../base/index.d.ts';

export type FileValueConnector = BaseValueConnector & {
  getDirectory(): string;
};

export function createFileValueConnector(
  directory: string,
  options?: ConnectorOptions,
): Promise<FileValueConnector>;
