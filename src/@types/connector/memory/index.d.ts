/// connector/memory

import type {Atoms, Connector, ConnectorOptions} from '../../index.d.ts';

export interface MemoryConnector extends Connector {
  getAtoms(): Atoms;
  getJson(): string;
  setJson(json: string): void;
}

export type MemoryConnectorImplementations = {
  atomDepth: number;
  onWrite?: () => Promise<void>;
};

export function createMemoryConnector(
  implementations: MemoryConnectorImplementations,
  options?: ConnectorOptions,
): Promise<MemoryConnector>;
