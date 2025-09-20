/// connector/memory

import type {Connector, ConnectorOptions} from '../../index.d.ts';

export interface MemoryConnector extends Connector {
  setJson(json: string): void;
}

export type MemoryConnectorImplementations = {
  onWrite?: () => Promise<void>;
};

export function createMemoryConnector(
  atomDepth: number,
  implementations?: MemoryConnectorImplementations,
  options?: ConnectorOptions,
): Promise<MemoryConnector>;
