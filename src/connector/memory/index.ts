import {createSynclet} from '@synclets';
import type {DataConnector, MetaConnector} from '@synclets/@types';
import type {
  createMemoryDataConnector as createMemoryDataConnectorDecl,
  createMemoryMetaConnector as createMemoryMetaConnectorDecl,
  createMemorySynclet as createMemorySyncletDecl,
  MemoryDataConnectorOptions,
  MemoryMetaConnectorOptions,
  MemorySyncletOptions,
} from '@synclets/@types/connector/memory';
import {createMemoryConnector} from '../../common/memory.ts';

export const createMemoryDataConnector: typeof createMemoryDataConnectorDecl = <
  Depth extends number,
>({
  depth,
}: MemoryDataConnectorOptions<Depth>): DataConnector<Depth> =>
  createMemoryConnector(false, depth);

export const createMemoryMetaConnector: typeof createMemoryMetaConnectorDecl = <
  Depth extends number,
>({
  depth,
}: MemoryMetaConnectorOptions<Depth>): MetaConnector<Depth> =>
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
