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
import {getBrokerFunctions} from '../common/broker.ts';
import {ifNotUndefined, isUndefined, promiseNew} from '../common/other.ts';
import {UTF8} from '../common/string.ts';

export const createWsBrokerTransport: typeof createWsBrokerTransportDecl = ({
  webSocketServer,
  path = null,
  brokerPaths = /.*/,
  ...options
}: WsBrokerTransportOptions): WsBrokerTransport => {
  let originalShouldHandle: (request: IncomingMessage) => boolean;

  const [
    addConnection,
    ,
    ,
    getValidPath,
    getPaths,
    getClientIds,
    serverAttach,
    serverDetach,
    serverSendPacket,
  ] = getBrokerFunctions(path, brokerPaths);

  const onConnection = (webSocket: WebSocket, request: IncomingMessage) =>
    ifNotUndefined(
      getValidPath(request),
      (path) => {
        const [, , receive, del] = addConnection(webSocket, path);
        webSocket.on('message', receive).on('close', del);
        return true;
      },
      () => webSocket.close(),
    );

  const attach = async (
    receivePacket: (packet: string) => Promise<void>,
  ): Promise<void> => {
    originalShouldHandle = webSocketServer.shouldHandle.bind(
      webSocketServer,
    ) as (request: IncomingMessage) => boolean;
    webSocketServer.shouldHandle = (request) =>
      originalShouldHandle(request) && !isUndefined(getValidPath(request));

    webSocketServer.on('connection', onConnection);
    serverAttach(receivePacket);
  };

  const detach = async () => {
    webSocketServer.off('connection', onConnection);
    webSocketServer.shouldHandle = originalShouldHandle;
    serverDetach();
  };

  const sendPacket = async (packet: string): Promise<void> => {
    serverSendPacket(packet);
  };

  const getWebSocketServer = () => webSocketServer;

  return createTransport({attach, detach, sendPacket}, options, {
    getWebSocketServer,
    getPaths,
    getClientIds,
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

  const attach = async (
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

  const detach = async (): Promise<void> => removeMessageListener?.();

  const sendPacket = async (packet: string): Promise<void> =>
    webSocket.send(packet);

  const getWebSocket = () => webSocket;

  return createTransport({attach, detach, sendPacket}, options, {
    getWebSocket,
  }) as WsClientTransport<WebSocketType>;
};
