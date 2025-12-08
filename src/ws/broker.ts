import {createSynclet, createTransport, RESERVED} from '@synclets';
import {TransportOptions} from '@synclets/@types';
import type {
  createWsBrokerTransport as createWsBrokerTransportDecl,
  createWsPureBroker as createWsPureBrokerDecl,
  WsBrokerTransport,
  WsBrokerTransportOptions,
  WsPureBroker,
} from '@synclets/@types/ws';
import {IncomingMessage} from 'http';
import {WebSocket, WebSocketServer} from 'ws';
import {getBrokerFunctions} from '../common/broker.ts';
import {objFreeze} from '../common/object.ts';
import {ifNotUndefined, isNull} from '../common/other.ts';
import {EMPTY_STRING, strMatch, strTest, UTF8} from '../common/string.ts';

const SERVER_ID = RESERVED + 's';

const addWebSocketConnection = (
  webSocket: WebSocket,
  request: IncomingMessage,
  path: string,
  addConnection: (
    id: string,
    send: (packet: string) => void,
    path: string,
  ) => [receivePacket: (packet: string) => void, close: () => void],
) =>
  ifNotUndefined(request.headers['sec-websocket-key'], (id) => {
    const [receivePacket, close] = addConnection(
      id,
      (packet: string) => webSocket.send(packet),
      path,
    );
    webSocket
      .on('message', (data) => receivePacket(data.toString(UTF8)))
      .on('close', close);
  });

export const createWsPureBroker = (async (
  webSocketServer: WebSocketServer,
  brokerPaths?: RegExp,
) => {
  const synclet = await createSynclet({
    transport: createWsBrokerTransport(webSocketServer, {
      path: null,
      brokerPaths,
    }),
  });

  const getWebSocketServer = () => webSocketServer;

  const destroy = synclet.destroy;

  return objFreeze({getWebSocketServer, destroy} as WsPureBroker);
}) as typeof createWsPureBrokerDecl;

export const createWsBrokerTransport = ((
  webSocketServer: WebSocketServer,
  {
    path = EMPTY_STRING,
    brokerPaths = /.*/,
    ...options
  }: WsBrokerTransportOptions & TransportOptions = {},
) => {
  let handleSendPacket: ((packet: string) => void) | undefined;
  let handleClose: (() => void) | undefined;

  const [addConnection, clearConnections] = getBrokerFunctions();

  const getValidPath = (request: IncomingMessage): string | undefined =>
    ifNotUndefined(
      strMatch(request.url ?? '/', /\/([^?]*)/),
      ([, requestPath]) =>
        requestPath === path || strTest(requestPath, brokerPaths)
          ? requestPath
          : undefined,
    );

  const onConnection = (webSocket: WebSocket, request: IncomingMessage) =>
    ifNotUndefined(getValidPath(request), (requestPath) =>
      addWebSocketConnection(webSocket, request, requestPath, addConnection),
    );

  const connect = async (
    receivePacket: (packet: string) => Promise<void>,
  ): Promise<void> => {
    webSocketServer.on('connection', onConnection);
    if (!isNull(path)) {
      const [sendPacket, close] = addConnection(SERVER_ID, receivePacket, path);
      handleSendPacket = sendPacket;
      handleClose = close;
    }
  };

  const disconnect = async () => {
    webSocketServer.off('connection', onConnection);
    handleClose?.();
    clearConnections();
    handleClose = undefined;
    handleSendPacket = undefined;
  };

  const sendPacket = async (packet: string): Promise<void> => {
    handleSendPacket?.(packet);
  };

  const transport = createTransport({connect, disconnect, sendPacket}, options);

  const getWebSocketServer = () => webSocketServer;

  return objFreeze({...transport, getWebSocketServer}) as WsBrokerTransport;
}) as typeof createWsBrokerTransportDecl;
