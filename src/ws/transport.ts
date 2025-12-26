import {createTransport} from '@synclets';
import type {
  createWsBrokerTransport as createWsBrokerTransportDecl,
  createWsClientTransport as createWsClientTransportDecl,
  WebSocketTypes,
  WsBrokerTransport,
  WsBrokerTransportOptions,
  WsClientTransport,
  WsClientTransportOptions,
} from '@synclets/@types/ws';
import {IncomingMessage} from 'http';
import {WebSocket} from 'ws';
import {getConnectionFunctions} from '../common/connection.ts';
import {ifNotUndefined, isNull, promiseNew} from '../common/other.ts';
import {EMPTY_STRING, UTF8} from '../common/string.ts';

export const createWsBrokerTransport: typeof createWsBrokerTransportDecl = ({
  webSocketServer,
  path = EMPTY_STRING,
  brokerPaths = /.*/,
  ...options
}: WsBrokerTransportOptions): WsBrokerTransport => {
  let handleSend: ((packet: string) => void) | undefined;
  let handleDel: (() => void) | undefined;

  const [addConnection, , clearConnections, getValidPath] =
    getConnectionFunctions(path, brokerPaths);

  const onConnection = (webSocket: WebSocket, request: IncomingMessage) =>
    ifNotUndefined(
      getValidPath(request),
      (path) => {
        const [, , receive, del] = addConnection(webSocket, path);
        webSocket
          .off('message', receive)
          .off('close', del)
          .on('message', receive)
          .on('close', del);
        return true;
      },
      () => webSocket.close(),
    );

  const connect = async (
    receivePacket: (packet: string) => Promise<void>,
  ): Promise<void> => {
    webSocketServer.on('connection', onConnection);
    if (!isNull(path)) {
      const [, , send, del] = addConnection({send: receivePacket}, path);
      handleSend = send;
      handleDel = del;
    }
  };

  const disconnect = async () => {
    webSocketServer.off('connection', onConnection);
    handleDel?.();
    clearConnections();
    handleDel = undefined;
    handleSend = undefined;
  };

  const sendPacket = async (packet: string): Promise<void> => {
    handleSend?.(packet);
  };

  return createTransport({connect, disconnect, sendPacket}, options, {
    getWebSocketServer: () => webSocketServer,
  }) as WsBrokerTransport;
};

export const createWsClientTransport: typeof createWsClientTransportDecl = <
  WebSocketType extends WebSocketTypes,
>({
  webSocket,
  ...options
}: WsClientTransportOptions<WebSocketType>): WsClientTransport<WebSocketType> => {
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
