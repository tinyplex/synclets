import {
  createDurableObjectBrokerTransport as createDurableObjectBrokerTransportDecl,
  DurableObjectBrokerTransport,
} from '@synclets/@types/durable-object';
import {arrayForEach} from '../common/array.ts';
import {getBrokerFunctions} from '../common/broker.ts';
import {objValues} from '../common/object.ts';
import {ifNotUndefined} from '../common/other.ts';
import {createDurableObjectTransport, createResponse} from './common.ts';

export const createDurableObjectBrokerTransport: typeof createDurableObjectBrokerTransportDecl =
  (options) => {
    let attached = false;
    let hibernated = true;

    const [
      addSocket,
      socketMessage,
      socketClose,
      socketError,
      serverAttach,
      serverDetach,
      serverSendPacket,
      getClientIds,
    ] = getBrokerFunctions();

    const wakeAndRunIfAttached = <Result>(
      ctx: DurableObjectState,
      actions: () => Result,
      otherwise?: () => Result,
    ): Result | undefined => {
      if (attached) {
        if (hibernated) {
          arrayForEach(ctx.getWebSockets(), (webSocket) =>
            ifNotUndefined(ctx.getTags(webSocket)[0], (id) =>
              addSocket(webSocket, id),
            ),
          );
          hibernated = false;
        }
        return actions();
      } else {
        return otherwise?.();
      }
    };

    const fetch = (ctx: DurableObjectState, _request: Request): Response =>
      wakeAndRunIfAttached(
        ctx,
        () => {
          const [client, webSocket] = objValues(new WebSocketPair());
          ctx.acceptWebSocket(webSocket, [addSocket(webSocket)]);
          return createResponse(101, client);
        },
        () => createResponse(400),
      )!;

    const webSocketMessage = async (
      ctx: DurableObjectState,
      webSocket: WebSocket,
      message: ArrayBuffer | string,
    ): Promise<void> =>
      wakeAndRunIfAttached(ctx, () => socketMessage(webSocket, message));

    const webSocketClose = async (
      ctx: DurableObjectState,
      webSocket: WebSocket,
    ): Promise<void> => wakeAndRunIfAttached(ctx, () => socketClose(webSocket));

    const webSocketError = async (
      ctx: DurableObjectState,
      webSocket: WebSocket,
    ): Promise<void> => wakeAndRunIfAttached(ctx, () => socketError(webSocket));

    const attach = async (
      receivePacket: (packet: string) => Promise<void>,
    ): Promise<void> => {
      attached = true;
      serverAttach(receivePacket);
    };

    const detach = async () => {
      attached = false;
      serverDetach();
    };

    const sendPacket = async (packet: string): Promise<void> =>
      serverSendPacket(packet);

    return createDurableObjectTransport(
      {attach, detach, sendPacket},
      {fetch, webSocketMessage, webSocketClose, webSocketError},
      {getClientIds},
      options,
    ) as DurableObjectBrokerTransport;
  };
