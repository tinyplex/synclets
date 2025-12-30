import {createDurableObjectBrokerTransport as createDurableObjectBrokerTransportDecl} from '@synclets/@types/durable-object';
import {getConnectionFunctions} from '../common/connection.ts';
import {objValues} from '../common/object.ts';
import {ifNotUndefined, isNull} from '../common/other.ts';
import {EMPTY_STRING} from '../common/string.ts';
import {createDurableObjectTransport, createResponse} from './common.ts';

export const createDurableObjectBrokerTransport: typeof createDurableObjectBrokerTransportDecl =
  ({path = EMPTY_STRING, brokerPaths = /.*/, ...options}) => {
    let handleSend: ((packet: string) => void) | undefined;
    let handleDel: (() => void) | undefined;
    let connected = false;

    const [addConnection, getReceive, clearConnections, getValidPath] =
      getConnectionFunctions(path, brokerPaths);

    const fetch = async (
      ctx: DurableObjectState,
      request: Request,
    ): Promise<Response | undefined> => {
      if (connected) {
        const [client, server] = objValues(new WebSocketPair());
        return onConnection(server, ctx, request)
          ? createResponse(101, client)
          : createResponse(400);
      }
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

    const connect = async (
      receivePacket: (packet: string) => Promise<void>,
    ): Promise<void> => {
      connected = true;
      if (!isNull(path)) {
        const [, , send, del] = addConnection({send: receivePacket}, path);
        handleSend = send;
        handleDel = del;
      }
    };

    const disconnect = async () => {
      connected = false;
      handleDel?.();
      clearConnections();
      handleDel = undefined;
      handleSend = undefined;
    };

    const sendPacket = async (packet: string): Promise<void> => {
      handleSend?.(packet);
    };

    return createDurableObjectTransport(
      {connect, disconnect, sendPacket},
      {fetch, webSocketMessage},
      options,
    );
  };
