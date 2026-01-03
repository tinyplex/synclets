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
      getReceive,
      getDel,
      getValidPath,
      getPaths,
      getClientIds,
      serverAttach,
      serverDetach,
      serverSendPacket,
    ] = getBrokerFunctions(path, brokerPaths);

    const fetch = async (
      ctx: DurableObjectState,
      request: Request,
    ): Promise<Response> => {
      if (attached) {
        const [client, server] = objValues(new WebSocketPair());
        if (onConnection(server, ctx, request)) {
          return createResponse(101, client);
        }
      }
      return createResponse(400);
    };

    const onConnection = (
      webSocket: WebSocket,
      ctx: DurableObjectState,
      request: Request,
    ) =>
      ifNotUndefined(getValidPath(request), (path) => {
        const [clientId] = addConnection(webSocket, path);
        ctx.acceptWebSocket(webSocket, [path, clientId]);
        return true;
      });

    const webSocketMessage = async (
      _ctx: DurableObjectState,
      webSocket: WebSocket,
      message: ArrayBuffer | string,
    ): Promise<void> =>
      ifNotUndefined(getReceive(webSocket), (received) => received(message));

    const webSocketClose = async (
      _ctx: DurableObjectState,
      webSocket: WebSocket,
    ): Promise<void> => ifNotUndefined(getDel(webSocket), (del) => del());

    const webSocketError = webSocketClose;

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
