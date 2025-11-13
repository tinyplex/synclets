import {createTransport} from '@synclets';
import type {TransportOptions} from '@synclets/@types';
import type {
  createWsClientTransport as createWsClientTransportDecl,
  WebSocketTypes,
  WsClientTransport,
} from '@synclets/@types/transport/ws';
import {objFreeze} from '../../common/object.ts';
import {promiseNew} from '../../common/other.ts';
import {UTF8} from '../../common/string.ts';

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

  const transport = createTransport({connect, disconnect, sendPacket}, options);

  return objFreeze({
    ...transport,
    getWebSocket: () => webSocket,
  }) as WsClientTransport<WebSocketType>;
};
