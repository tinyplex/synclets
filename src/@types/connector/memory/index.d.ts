/// connector/memory

import type {
  Address,
  Atom,
  Connector,
  ConnectorOptions,
  Context,
  Hash,
  Timestamp,
} from '../../index.d.ts';

export type DataNode = {[id: string]: DataNode} | Atom | undefined;

export type MetaNode = [Hash, {[id: string]: MetaNode}] | Timestamp | undefined;

export interface MemoryConnector extends Connector {
  dumpData(): DataNode;
  dumpMeta(): MetaNode;
}

export type MemoryConnectorImplementations = {
  isParent: (
    address: Address,
    context: Context,
  ) => Promise<boolean | undefined>;
};

export function createMemoryConnector(
  implementations: MemoryConnectorImplementations,
  options?: ConnectorOptions,
): Promise<MemoryConnector>;
