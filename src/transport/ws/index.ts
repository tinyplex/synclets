import {createTransport} from '@synclets';
import type {TransportOptions} from '@synclets/@types';
import type {
  createWsTransport as createWsTransportDecl,
  WebSocketTypes,
  WsTransport,
} from '@synclets/@types/transport/ws';
import {objFreeze} from '../../common/object.ts';
import {promiseNew} from '../../common/other.ts';
import {UTF8} from '../../common/string.ts';

export const createWsTransport: typeof createWsTransportDecl = async <
  WebSocketType extends WebSocketTypes,
>(
  webSocket: WebSocketType,
  options?: TransportOptions,
): Promise<WsTransport<WebSocketType>> => {
  let messageListener: (() => void) | undefined;

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
    messageListener = addEventListener('message', ({data}) =>
      receivePacket(data.toString(UTF8)),
    );
  };

  const disconnect = async (): Promise<void> => messageListener?.();

  const sendPacket = async (packet: string): Promise<void> =>
    webSocket.send(packet);

  const transport = await createTransport(
    {connect, disconnect, sendPacket},
    options,
  );

  const wsTransport = objFreeze({
    ...transport,
    getWebSocket: () => webSocket,
  }) as WsTransport<WebSocketType>;

  return promiseNew((resolve, reject) => {
    if (webSocket.readyState != webSocket.OPEN) {
      const onAttempt = (error?: any) => {
        if (error) {
          reject(error);
        } else {
          removeOpenListener();
          removeErrorListener();
          resolve(wsTransport);
        }
      };
      const removeOpenListener = addEventListener('open', () => onAttempt());
      const removeErrorListener = addEventListener('error', onAttempt);
    } else {
      resolve(wsTransport);
    }
  });

  return wsTransport;
};
