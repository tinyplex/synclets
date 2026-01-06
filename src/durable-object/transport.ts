import {
  createDurableObjectBrokerTransport as createDurableObjectBrokerTransportDecl,
  DurableObjectBrokerTransport,
} from '@synclets/@types/durable-object';
import {getBrokerFunctions} from '../common/broker.ts';
import {objValues} from '../common/object.ts';
import {createDurableObjectTransport, createResponse} from './common.ts';

export const createDurableObjectBrokerTransport: typeof createDurableObjectBrokerTransportDecl =
  (options) => {
    let attached = false;

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

    const fetch = (ctx: DurableObjectState, _request: Request): Response => {
      if (attached) {
        const [client, webSocket] = objValues(new WebSocketPair());
        addSocket(webSocket);
        bindWebSocket(ctx, webSocket);
        return createResponse(101, client);
      }
      return createResponse(400);
    };

    const bindWebSocket = (ctx: DurableObjectState, webSocket: WebSocket) =>
      ctx.acceptWebSocket(webSocket);

    const webSocketMessage = async (
      _ctx: DurableObjectState,
      webSocket: WebSocket,
      message: ArrayBuffer | string,
    ): Promise<void> => socketMessage(webSocket, message);

    const webSocketClose = async (
      _ctx: DurableObjectState,
      webSocket: WebSocket,
    ): Promise<void> => socketClose(webSocket);

    const webSocketError = async (
      _ctx: DurableObjectState,
      webSocket: WebSocket,
    ): Promise<void> => socketError(webSocket);

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

    const sendPacket = async (packet: string): Promise<void> => {
      serverSendPacket(packet);
    };

    return createDurableObjectTransport(
      {attach, detach, sendPacket},
      {fetch, webSocketMessage, webSocketClose, webSocketError},
      {getClientIds},
      options,
    ) as DurableObjectBrokerTransport;
  };
