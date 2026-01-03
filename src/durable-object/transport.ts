import {
  createDurableObjectBrokerTransport as createDurableObjectBrokerTransportDecl,
  DurableObjectBrokerTransport,
} from '@synclets/@types/durable-object';
import {getBrokerFunctions} from '../common/broker.ts';
import {objValues} from '../common/object.ts';
import {ifNotUndefined} from '../common/other.ts';
import {createDurableObjectTransport, createResponse} from './common.ts';

export const createDurableObjectBrokerTransport: typeof createDurableObjectBrokerTransportDecl =
  ({path = null, brokerPaths = /.*/, ...options}) => {
    let attached = false;

    const [
      addConnection,
      getValidPath,
      getPaths,
      getClientIds,
      serverAttach,
      serverDetach,
      serverSendPacket,
      socketMessage,
      socketClose,
      socketError,
    ] = getBrokerFunctions(path, brokerPaths);

    const fetch = (ctx: DurableObjectState, request: Request): Response => {
      if (attached) {
        const [client, webSocket] = objValues(new WebSocketPair());
        if (onConnection(ctx, webSocket, request)) {
          return createResponse(101, client);
        }
      }
      return createResponse(400);
    };

    const onConnection = (
      ctx: DurableObjectState,
      webSocket: WebSocket,
      request: Request,
    ) =>
      ifNotUndefined(getValidPath(request), (path) => {
        addConnection(webSocket, path);
        bindWebSocket(ctx, webSocket);
        return true;
      });

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
      {getPaths, getClientIds},
      options,
    ) as DurableObjectBrokerTransport;
  };
