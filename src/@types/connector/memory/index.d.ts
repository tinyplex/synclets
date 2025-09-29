/// connector/memory

import type {DataConnector, MetaConnector} from '../../index.d.ts';

export function createMemoryDataConnector(
  depth: number,
): Promise<DataConnector>;

export function createMemoryMetaConnector(
  depth: number,
): Promise<MetaConnector>;
