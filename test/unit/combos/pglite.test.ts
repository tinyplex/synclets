import {PGlite} from '@electric-sql/pglite';
import {
  createPgliteDataConnector,
  createPgliteMetaConnector,
} from 'synclets/connector/pglite';
import {createStatelessWsServer} from 'synclets/server/stateless-ws';
import {createMemoryTransport} from 'synclets/transport/memory';
import {createWsTransport} from 'synclets/transport/ws';
import {getUniqueId} from 'synclets/utils';
import {WebSocket, WebSocketServer} from 'ws';
import {describeSyncletTests} from '../common.ts';

const WS_PORT = 9003;

const pglite = await PGlite.create();
describeSyncletTests(
  'memory',
  async () => {},
  async () => {},
  <Depth extends number>(depth: Depth) =>
    createPgliteDataConnector(depth, pglite, {table: 'data' + getUniqueId()}),
  <Depth extends number>(depth: Depth) =>
    createPgliteMetaConnector(depth, pglite, {table: 'meta' + getUniqueId()}),
  (uniqueId: string) => createMemoryTransport({poolId: uniqueId}),
);

describeSyncletTests(
  'ws',
  async () => createStatelessWsServer(new WebSocketServer({port: WS_PORT})),
  async (wsServer) => wsServer.destroy(),
  <Depth extends number>(depth: Depth) =>
    createPgliteDataConnector(depth, pglite, {table: 'data' + getUniqueId()}),
  <Depth extends number>(depth: Depth) =>
    createPgliteMetaConnector(depth, pglite, {table: 'meta' + getUniqueId()}),
  (uniqueId: string) =>
    createWsTransport(
      new WebSocket('ws://localhost:' + WS_PORT + '/' + uniqueId),
    ),
  20,
);
