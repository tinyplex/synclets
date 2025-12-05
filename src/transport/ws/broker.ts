import {createSynclet, createTransport, RESERVED} from '@synclets';
import {TransportOptions} from '@synclets/@types';
import {
  createWsBroker as createWsBrokerDecl,
  createWsBrokerTransport as createWsBrokerTransportDecl,
  WsBroker,
  WsBrokerTransport,
  WsBrokerTransportOptions,
} from '@synclets/@types/transport/ws';
import {IncomingMessage} from 'http';
import {WebSocket, WebSocketServer} from 'ws';
import {objFreeze} from '../../common/object.ts';
import {ifNotUndefined} from '../../common/other.ts';
import {EMPTY_STRING, strMatch, strSub, UTF8} from '../../common/string.ts';
import {getConnectionFunctions} from '../common.ts';

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
    webSocket.setMaxListeners(0);
    webSocket
      .on('message', (data) => receivePacket(data.toString(UTF8)))
      .on('close', close);
  });

export const createWsBroker = (async (
  webSocketServer: WebSocketServer,
  brokerPaths?: RegExp,
) => {
  const synclet = await createSynclet({
    transport: createWsBrokerTransport(webSocketServer, {brokerPaths}),
  });

  const getWebSocketServer = () => webSocketServer;

  const destroy = synclet.destroy;

  return objFreeze({getWebSocketServer, destroy} as WsBroker);
}) as typeof createWsBrokerDecl;

export const createWsBrokerTransport = ((
  webSocketServer: WebSocketServer,
  {
    path = EMPTY_STRING,
    brokerPaths = /([^?]*)/,
    ...options
  }: WsBrokerTransportOptions & TransportOptions = {},
) => {
  let handleSendPacket: ((packet: string) => void) | undefined;
  let handleClose: (() => void) | undefined;

  const [addConnection, clearConnections] = getConnectionFunctions();

  const onConnection = (webSocket: WebSocket, request: IncomingMessage) =>
    ifNotUndefined(
      request.url == '/' + path
        ? [EMPTY_STRING, path]
        : (strMatch(strSub(request.url ?? '/', 0), brokerPaths) ?? undefined),
      ([, path]) =>
        addWebSocketConnection(webSocket, request, path, addConnection),
    );

  const connect = async (
    receivePacket: (packet: string) => Promise<void>,
  ): Promise<void> => {
    webSocketServer.setMaxListeners(0);
    webSocketServer.on('connection', onConnection);
    const [sendPacket, close] = addConnection(SERVER_ID, receivePacket, path);
    handleSendPacket = sendPacket;
    handleClose = close;
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
