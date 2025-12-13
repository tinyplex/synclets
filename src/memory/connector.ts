import {createSynclet} from '@synclets';
import type {
  DataConnector,
  DataConnectorOptions,
  MetaConnector,
  MetaConnectorOptions,
} from '@synclets/@types';
import type {
  createMemoryDataConnector as createMemoryDataConnectorDecl,
  createMemoryMetaConnector as createMemoryMetaConnectorDecl,
  createMemorySynclet as createMemorySyncletDecl,
  MemorySyncletOptions,
} from '@synclets/@types/memory';
import {createMemoryConnector} from '../common/memory.ts';

export const createMemoryDataConnector: typeof createMemoryDataConnectorDecl = <
  Depth extends number,
>({
  depth,
}: DataConnectorOptions<Depth>): DataConnector<Depth> =>
  createMemoryConnector(false, depth);

export const createMemoryMetaConnector: typeof createMemoryMetaConnectorDecl = <
  Depth extends number,
>({
  depth,
}: MetaConnectorOptions<Depth>): MetaConnector<Depth> =>
  createMemoryConnector(true, depth);

export const createMemorySynclet: typeof createMemorySyncletDecl = <
  Depth extends number,
>({
  depth,
  transport,
  implementations,
  id,
  logger,
}: MemorySyncletOptions<Depth>) =>
  createSynclet(
    {
      dataConnector: createMemoryDataConnector({depth}),
      metaConnector: createMemoryMetaConnector({depth}),
      transport,
    },
    implementations,
    {id, logger},
  );
