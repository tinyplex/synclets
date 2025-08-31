import {createConnector, createSynclet, createTransport} from 'synclets';

const connector = createConnector({} as any);
const transport = createTransport({} as any);

createSynclet(connector, transport);
