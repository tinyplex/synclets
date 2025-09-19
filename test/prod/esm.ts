import {createConnector, createSynclet, createTransport} from 'synclets';

const connector = await createConnector(1, {} as any);
const transport = await createTransport({} as any);

await createSynclet(connector, transport);
