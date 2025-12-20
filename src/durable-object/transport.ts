import {createDurableObjectBrokerTransport as createDurableObjectBrokerTransportDecl} from '@synclets/@types/durable-object';
import {getUniqueId} from '@synclets/utils';
import {arrayForEach} from '../common/array.ts';
import {objValues} from '../common/object.ts';
import {ifNotUndefined, slice} from '../common/other.ts';
import {
  ASTERISK,
  EMPTY_STRING,
  SPACE,
  strMatch,
  strTest,
} from '../common/string.ts';
import {createDurableObjectTransport, createResponse} from './common.ts';

export const createDurableObjectBrokerTransport: typeof createDurableObjectBrokerTransportDecl =
  ({path = EMPTY_STRING, brokerPaths = /.*/, ...options}) => {
    let handleSendPacket: ((packet: string) => void) | undefined;
    let handleClose: (() => void) | undefined;
    let connected = false;

    // const [addConnection, clearConnections] = getBrokerFunctions();

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

    const fetch = async (
      ctx: DurableObjectState,
      request: Request,
    ): Promise<Response | undefined> => {
      if (connected) {
        const [client, server] = objValues(new WebSocketPair());
        return onConnection(server, ctx, request)
          ? createResponse(101, client)
          : createResponse(404);
      }
    };

    const onConnection = (
      webSocket: WebSocket,
      ctx: DurableObjectState,
      request: Request,
    ) =>
      ifNotUndefined(getValidPath(request), (path) => {
        const clientId = getUniqueId();
        ctx.acceptWebSocket(webSocket, [clientId, path]);
        return true;
      });

    const webSocketMessage = async (
      ctx: DurableObjectState,
      ws: WebSocket,
      message: ArrayBuffer | string,
    ): Promise<boolean | undefined> =>
      ifNotUndefined(ctx.getTags(ws), ([clientId, path]) => {
        const packet = message.toString();
        const splitAt = packet.indexOf(SPACE);
        if (splitAt !== -1) {
          const to = slice(packet, 0, splitAt);
          const remainder = slice(packet, splitAt + 1);
          const forwardedPacket = clientId + SPACE + remainder;
          if (to === ASTERISK) {
            arrayForEach(ctx.getWebSockets(path), (otherClient) =>
              otherClient !== ws ? otherClient.send(forwardedPacket) : 0,
            );
          } else if (to != clientId) {
            ctx.getWebSockets(to)[0]?.send(forwardedPacket);
          }
        }
        return true;
      });

    const connect = async (
      _receivePacket: (packet: string) => Promise<void>,
    ): Promise<void> => {
      connected = true;
      // if (!isNull(path)) {
      //   const [sendPacket, close] = addConnection(
      //     SERVER_ID,
      //     receivePacket,
      //     path,
      //   );
      //   handleSendPacket = sendPacket;
      //   handleClose = close;
      // }
    };

    const disconnect = async () => {
      connected = false;
      // webSocketServer.off('connection', onConnection);
      handleClose?.();
      // clearConnections();
      // handleClose = undefined;
      // handleSendPacket = undefined;
    };

    const sendPacket = async (packet: string): Promise<void> => {
      handleSendPacket?.(packet);
    };

    return createDurableObjectTransport(
      {connect, disconnect, sendPacket},
      {fetch, webSocketMessage},
      options,
    );
  };
