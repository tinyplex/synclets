import {
  createDataConnector,
  createMetaConnector,
  createSynclet,
  createTransport,
} from 'synclets';

const dataConnector = createDataConnector(1, {} as any);
const metaConnector = createMetaConnector(1, {} as any);
const transport = createTransport({} as any);

await createSynclet(dataConnector, metaConnector, transport);
