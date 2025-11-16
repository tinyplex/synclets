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

type Connection = {
  onPacket: (handlePacket: (packet: string) => void) => void;
  onClose: (handleClose: () => void) => void;
  send: (packet: string) => void;
};

const getConnectionFunctions = (): [
  addConnection: (
    connectionId: string,
    connection: Connection,
    path: string,
  ) => void,
  clearConnections: () => void,
] => {
  const connectionsByPath: Map<string, Map<string, Connection>> = mapNew();

  const addConnection = (
    connectionId: string,
    connection: Connection,
    path: string,
  ) => {
    const connections = mapEnsure(
      connectionsByPath,
      path,
      mapNew<string, Connection>,
    );
    mapSet(connections, connectionId, connection);

    connection.onPacket((packet: string) => {
      const splitAt = packet.indexOf(SPACE);
      if (splitAt !== -1) {
        const to = slice(packet, 0, splitAt);
        const remainder = slice(packet, splitAt + 1);
        const forwardedPacket = connectionId + SPACE + remainder;
        if (to === ASTERISK) {
          mapForEach(connections, (otherConnectionId, otherConnection) =>
            otherConnectionId !== connectionId
              ? otherConnection.send(forwardedPacket)
              : 0,
          );
        } else {
          mapGet(connections, to)?.send(forwardedPacket);
        }
      }
    });

    connection.onClose(() => {
      mapDel(connections, connectionId);
      if (mapIsEmpty(connections)) {
        mapDel(connectionsByPath, path);
      }
    });
  };

  const clearConnections = () => mapClear(connectionsByPath);

  return [addConnection, clearConnections];
};

const connectFromRequest = (
  webSocket: WebSocket,
  request: IncomingMessage,
  path: string,
  addConnection: (
    connectionId: string,
    connection: Connection,
    path: string,
  ) => void,
) =>
  ifNotUndefined(request.headers['sec-websocket-key'], (connectionId) =>
    addConnection(
      connectionId,
      {
        onPacket: (handlePacket: (packet: string) => void) => {
          webSocket.on('message', (data) => handlePacket(data.toString(UTF8)));
        },
        onClose: (handleClose) => webSocket.on('close', handleClose),
        send: (packet: string) => webSocket.send(packet),
      },
      path,
    ),
  );

export const createWsServer = ((webSocketServer: WebSocketServer) => {
  const [addConnection, clearConnections] = getConnectionFunctions();

  const onConnection = (webSocket: WebSocket, request: IncomingMessage) =>
    ifNotUndefined(strMatch(request.url, PATH_REGEX), ([, path]) =>
      connectFromRequest(webSocket, request, path, addConnection),
    );

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
  let handleServerPacket: ((packet: string) => void) | undefined;

  const path = options.path ?? EMPTY_STRING;

  const [addConnection, clearConnections] = getConnectionFunctions();

  const onConnection = (webSocket: WebSocket, request: IncomingMessage) =>
    request.url == '/' + path
      ? connectFromRequest(webSocket, request, path, addConnection)
      : 0;

  const connect = async (
    receivePacket: (packet: string) => Promise<void>,
  ): Promise<void> => {
    webSocketServer.on('connection', onConnection);
    addConnection(
      SERVER_ID,
      {
        onPacket: (handlePacket: (packet: string) => void) => {
          handleServerPacket = handlePacket;
        },
        onClose: () => {
          handleServerPacket = undefined;
        },
        send: (packet: string) => receivePacket(packet),
      },
      path,
    );
  };

  const disconnect = async () => {
    webSocketServer.off('connection', onConnection);
    clearConnections();
  };

  const sendPacket = async (packet: string): Promise<void> =>
    handleServerPacket?.(packet);

  const transport = createTransport({connect, disconnect, sendPacket}, options);

  const getWebSocketServer = () => webSocketServer;

  return objFreeze({...transport, getWebSocketServer}) as WsServerTransport;
}) as typeof createWsServerTransportDecl;
