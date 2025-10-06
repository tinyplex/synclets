import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/connector/memory';
import {createWsServer} from 'synclets/server/ws';
import {createMemoryTransport} from 'synclets/transport/memory';
import {createWsTransport} from 'synclets/transport/ws';
import {WebSocketServer} from 'ws';
import {describeConnectorTests} from '../common.ts';

describeConnectorTests(
  'memory over memory',
  async () => {},
  async () => {},
  <Depth extends number>(depth: Depth) => createMemoryDataConnector(depth),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector(depth),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);

describeConnectorTests(
  'memory over ws',
  async () => createWsServer(new WebSocketServer({port: 9000})),
  async (wsServer) => wsServer.destroy(),
  <Depth extends number>(depth: Depth) => createMemoryDataConnector(depth),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector(depth),
  (uniqueId: string) =>
    createWsTransport(new WebSocket('ws://localhost:9000/' + uniqueId)),
  5,
);
