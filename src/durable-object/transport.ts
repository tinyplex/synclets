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

    const fetch = async (
      ctx: DurableObjectState,
      request: Request,
    ): Promise<Response | undefined> => {
      if (attached) {
        const [client, server] = objValues(new WebSocketPair());
        return onConnection(server, ctx, request)
          ? createResponse(101, client)
          : createResponse(400);
      }
    };

    const webSocketMessage = async (
      ctx: DurableObjectState,
      ws: WebSocket,
      message: ArrayBuffer | string,
    ): Promise<boolean | undefined> =>
      ifNotUndefined(
        getReceive(...(ctx.getTags(ws) as [string, string])),
        (received) => {
          received(message);
          return true;
        },
      );

    const webSocketClose = async (
      ctx: DurableObjectState,
      ws: WebSocket,
    ): Promise<boolean | undefined> =>
      ifNotUndefined(
        getDel(...(ctx.getTags(ws) as [string, string])),
        (del) => {
          del();
          return true;
        },
      );

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
