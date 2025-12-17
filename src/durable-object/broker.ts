import {createDurableObjectBrokerTransport as createDurableObjectBrokerTransportDecl} from '@synclets/@types/durable-object';
import {arrayForEach} from '../common/array.ts';
import {objValues} from '../common/object.ts';
import {ifNotNull, ifNotUndefined, slice} from '../common/other.ts';
import {ASTERISK, SPACE} from '../common/string.ts';
import {
  createDurableObjectTransport,
  createResponse,
  createUpgradeRequiredResponse,
  getClientId,
  getPathId,
} from './common.ts';

export const createDurableObjectBrokerTransport: typeof createDurableObjectBrokerTransportDecl =
  ({path, brokerPaths, ...options}) => {
    const _ = {
      path,
      brokerPaths,
    };

    const connect = async (
      _receivePacket: (packet: string) => Promise<void>,
    ): Promise<void> => {};

    const disconnect = async () => {};

    const sendPacket = async (_packet: string): Promise<void> => {};

    const fetch = async (
      ctx: DurableObjectState,
      request: Request,
    ): Promise<Response | undefined> => {
      const pathId = getPathId(request);
      return ifNotNull(
        getClientId(request),
        (clientId) => {
          const [webSocket, client] = objValues(new WebSocketPair());
          ctx.acceptWebSocket(client, [clientId, pathId]);
          return createResponse(101, webSocket);
        },
        createUpgradeRequiredResponse,
      ) as Response;
    };

    const webSocketMessage = async (
      ctx: DurableObjectState,
      ws: WebSocket,
      message: ArrayBuffer | string,
    ): Promise<boolean | undefined> =>
      ifNotUndefined(ctx.getTags(ws)[0], (clientId) => {
        const packet = message.toString();
        const splitAt = packet.indexOf(SPACE);
        if (splitAt !== -1) {
          const to = slice(packet, 0, splitAt);
          const remainder = slice(packet, splitAt + 1);
          const forwardedPacket = clientId + SPACE + remainder;
          if (to === ASTERISK) {
            arrayForEach(ctx.getWebSockets(), (otherClient) =>
              otherClient !== ws ? otherClient.send(forwardedPacket) : 0,
            );
          } else if (to != clientId) {
            ctx.getWebSockets(to)[0]?.send(forwardedPacket);
          }
        }
        return true;
      });

    return createDurableObjectTransport(
      {connect, disconnect, sendPacket},
      {fetch, webSocketMessage},
      options,
    );
  };
