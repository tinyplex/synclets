import {createTransport, RESERVED} from '@synclets';
import type {
  createWsBrokerTransport as createWsBrokerTransportDecl,
  WsBrokerTransport,
  WsBrokerTransportOptions,
} from '@synclets/@types/ws';
import {IncomingMessage} from 'http';
import {WebSocket} from 'ws';
import {getBrokerFunctions} from '../common/broker.ts';
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

export const createWsBrokerTransport: typeof createWsBrokerTransportDecl = ({
  webSocketServer,
  path = EMPTY_STRING,
  brokerPaths = /.*/,
  ...options
}: WsBrokerTransportOptions): WsBrokerTransport => {
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
    ifNotUndefined(
      getValidPath(request),
      (requestPath) =>
        addWebSocketConnection(webSocket, request, requestPath, addConnection),
      () => webSocket.close(),
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

  return createTransport(
    {connect, disconnect, sendPacket},
    options,
    {getWebSocketServer: () => webSocketServer},
  ) as WsBrokerTransport;
};
