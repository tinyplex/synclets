import {TransportOptions} from '@synclets/@types';
import {
  createWsBrokerTransport as createWsBrokerTransportDecl,
  createWsServer as createWsServerDecl,
  WsBrokerTransport,
  WsServer,
} from '@synclets/@types/transport/ws';
import {IncomingMessage} from 'http';
import {WebSocket, WebSocketServer} from 'ws';
import {objFreeze} from '../../common/object.ts';
import {ifNotUndefined} from '../../common/other.ts';
import {EMPTY_STRING, strMatch, UTF8} from '../../common/string.ts';
import {createTransport, RESERVED} from '../../core/index.ts';
import {getConnectionFunctions} from '../common.ts';

const PATH_REGEX = /\/([^?]*)/;
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

export const createWsServer = ((webSocketServer: WebSocketServer) => {
  const [addConnection, clearConnections] = getConnectionFunctions();

  const onConnection = (webSocket: WebSocket, request: IncomingMessage) =>
    ifNotUndefined(strMatch(request.url, PATH_REGEX) ?? undefined, ([, path]) =>
      addWebSocketConnection(webSocket, request, path, addConnection),
    );

  webSocketServer.on('connection', onConnection);

  const getWebSocketServer = () => webSocketServer;

  const destroy = () => {
    webSocketServer.off('connection', onConnection);
    clearConnections();
  };

  return objFreeze({getWebSocketServer, destroy} as WsServer);
}) as typeof createWsServerDecl;

export const createWsBrokerTransport = ((
  webSocketServer: WebSocketServer,
  options: TransportOptions & {path?: string} = {},
) => {
  let handleSendPacket: ((packet: string) => void) | undefined;
  let handleClose: (() => void) | undefined;

  const path = options.path ?? EMPTY_STRING;

  const [addConnection, clearConnections] = getConnectionFunctions();

  const onConnection = (webSocket: WebSocket, request: IncomingMessage) =>
    request.url == '/' + path
      ? addWebSocketConnection(webSocket, request, path, addConnection)
      : 0;

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
