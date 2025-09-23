/// connector/memory

import type {Connector, ConnectorOptions} from '../../index.d.ts';

export function createMemoryConnector(
  depth: number,
  options?: ConnectorOptions,
): Promise<Connector>;
