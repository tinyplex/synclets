import {
  createDataConnector,
  createMetaConnector,
  createSynclet,
  createTransport,
} from 'synclets';

const dataConnector = await createDataConnector(1, {} as any);
const metaConnector = await createMetaConnector(1, {} as any);
const transport = await createTransport({} as any);

await createSynclet(dataConnector, metaConnector, transport);
