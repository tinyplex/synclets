/// connector/memory

import type {
  ConnectorOptions,
  DataConnector,
  MetaConnector,
} from '../../index.d.ts';

export function createMemoryDataConnector(
  depth: number,
  options?: ConnectorOptions,
): Promise<DataConnector>;

export function createMemoryMetaConnector(
  depth: number,
  options?: ConnectorOptions,
): Promise<MetaConnector>;
