import {createTransport, RESERVED} from '@synclets';
import type {TransportOptions} from '@synclets/@types';
import type {
  createWsBrokerTransport as createWsBrokerTransportDecl,
  createWsClientTransport as createWsClientTransportDecl,
  WebSocketTypes,
  WsBrokerTransport,
  WsBrokerTransportOptions,
  WsClientTransport,
} from '@synclets/@types/ws';
import {getUniqueId} from '@synclets/utils';
import {IncomingMessage} from 'http';
import {WebSocket} from 'ws';
import {getBrokerFunctions} from '../common/broker.ts';
import {ifNotUndefined, isNull, promiseNew} from '../common/other.ts';
import {EMPTY_STRING, strMatch, strTest, UTF8} from '../common/string.ts';

const SERVER_ID = RESERVED + 's';

export const createWsBrokerTransport: typeof createWsBrokerTransportDecl = ({
  webSocketServer,
  path = EMPTY_STRING,
  brokerPaths = /.*/,
  ...options
}: WsBrokerTransportOptions): WsBrokerTransport => {
  let handleSendPacket: ((packet: string) => void) | undefined;
  let handleClose: (() => void) | undefined;

  const [addConnection, clearConnections] = getBrokerFunctions();

  const getValidPath = ({
    url = EMPTY_STRING,
  }: {
    url?: string;
  }): string | undefined =>
    ifNotUndefined(
      strMatch(new URL(url).pathname ?? '/', /\/([^?]*)/),
      ([, requestPath]) =>
        requestPath === path || strTest(requestPath, brokerPaths)
          ? requestPath
          : undefined,
    );

  const onConnection = (webSocket: WebSocket, request: IncomingMessage) =>
    ifNotUndefined(
      getValidPath(request),
      (path) => {
        const clientId = getUniqueId();
        const [receivePacket, close] = addConnection(clientId, webSocket, path);
        webSocket
          .on('message', (data) => receivePacket(data.toString(UTF8)))
          .on('close', close);
        return true;
      },
      () => webSocket.close(),
    );

  const connect = async (
    receivePacket: (packet: string) => Promise<void>,
  ): Promise<void> => {
    webSocketServer.on('connection', onConnection);
    if (!isNull(path)) {
      const [sendPacket, close] = addConnection(
        SERVER_ID,
        {send: receivePacket},
        path,
      );
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

  return createTransport({connect, disconnect, sendPacket}, options, {
    getWebSocketServer: () => webSocketServer,
  }) as WsBrokerTransport;
};

export const createWsClientTransport: typeof createWsClientTransportDecl = <
  WebSocketType extends WebSocketTypes,
>(
  webSocket: WebSocketType,
  options?: TransportOptions,
): WsClientTransport<WebSocketType> => {
  let removeMessageListener: (() => void) | undefined;

  const addEventListener = (
    event: keyof WebSocketEventMap,
    handler: (...args: any[]) => void,
  ) => {
    webSocket.addEventListener(event, handler);
    return () => webSocket.removeEventListener(event, handler);
  };

  const connect = async (
    receivePacket: (packet: string) => Promise<void>,
  ): Promise<void> => {
    removeMessageListener = addEventListener('message', ({data}) =>
      receivePacket(data.toString(UTF8)),
    );
    return promiseNew((resolve, reject) => {
      if (webSocket.readyState != webSocket.OPEN) {
        const onAttempt = (error?: any) => {
          if (error) {
            reject(error);
          } else {
            removeOpenListener();
            removeErrorListener();
            resolve();
          }
        };
        const removeOpenListener = addEventListener('open', () => onAttempt());
        const removeErrorListener = addEventListener('error', onAttempt);
      } else {
        resolve();
      }
    });
  };

  const disconnect = async (): Promise<void> => removeMessageListener?.();

  const sendPacket = async (packet: string): Promise<void> =>
    webSocket.send(packet);

  return createTransport({connect, disconnect, sendPacket}, options, {
    getWebSocket: () => webSocket,
  }) as WsClientTransport<WebSocketType>;
};
