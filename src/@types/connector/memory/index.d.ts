/// connector/memory

import type {Atoms, Connector, ConnectorOptions} from '../../index.d.ts';

export interface MemoryConnector extends Connector {
  getAtoms(): Atoms;
  getJson(): string;
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
