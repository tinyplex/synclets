/// connector/memory

import type {Connector, ConnectorOptions} from '../../index.d.ts';

export function createMemoryConnector(
  atomDepth: number,
  options?: ConnectorOptions,
): Promise<Connector>;
