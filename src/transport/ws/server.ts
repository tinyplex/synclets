import {TransportOptions} from '@synclets/@types';
import {
  createWsServer as createWsServerDecl,
  createWsServerTransport as createWsServerTransportDecl,
  WsServer,
  WsServerTransport,
} from '@synclets/@types/transport/ws';
import {IncomingMessage} from 'http';
import {WebSocket, WebSocketServer} from 'ws';
import {
  mapClear,
  mapDel,
  mapEnsure,
  mapForEach,
  mapGet,
  mapIsEmpty,
  mapNew,
  mapSet,
} from '../../common/map.ts';
import {objFreeze} from '../../common/object.ts';
import {ifNotUndefined, slice} from '../../common/other.ts';
import {
  ASTERISK,
  EMPTY_STRING,
  SPACE,
  strMatch,
  UTF8,
} from '../../common/string.ts';
import {createTransport, RESERVED} from '../../core/index.ts';

const PATH_REGEX = /\/([^?]*)/;
const SERVER_ID = RESERVED + 's';

const getConnectionFunctions = (): [
  addConnection: (
    id: string,
    send: (packet: string) => void,
    path: string,
  ) => [receivePacket: (packet: string) => void, close: () => void],
  clearConnections: () => void,
] => {
  const sendsByPath: Map<
    string,
    Map<string, (packet: string) => void>
  > = mapNew();

  const addConnection = (
    id: string,
    send: (packet: string) => void,
    path: string,
  ): [(packet: string) => void, () => void] => {
    const sends = mapEnsure(
      sendsByPath,
      path,
      mapNew<string, (packet: string) => void>,
    );
    mapSet(sends, id, send);

    const receivePacket = (packet: string) => {
      const splitAt = packet.indexOf(SPACE);
      if (splitAt !== -1) {
        const to = slice(packet, 0, splitAt);
        const remainder = slice(packet, splitAt + 1);
        const forwardedPacket = id + SPACE + remainder;
        if (to === ASTERISK) {
          mapForEach(sends, (otherId, otherSend) =>
            otherId !== id ? otherSend(forwardedPacket) : 0,
          );
        } else {
          mapGet(sends, to)?.(forwardedPacket);
        }
      }
    };

    const close = () => {
      mapDel(sends, id);
      if (mapIsEmpty(sends)) {
        mapDel(sendsByPath, path);
      }
    };

    return [receivePacket, close];
  };

  const clearConnections = () => mapClear(sendsByPath);

  return [addConnection, clearConnections];
};

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

  webSocketServer.setMaxListeners(0);
  webSocketServer.on('connection', onConnection);

  const getWebSocketServer = () => webSocketServer;

  const destroy = () => {
    webSocketServer.off('connection', onConnection);
    clearConnections();
  };

  return objFreeze({getWebSocketServer, destroy} as WsServer);
}) as typeof createWsServerDecl;

export const createWsServerTransport = ((
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

  return objFreeze({...transport, getWebSocketServer}) as WsServerTransport;
}) as typeof createWsServerTransportDecl;
