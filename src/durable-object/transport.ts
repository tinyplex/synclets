import {createDurableObjectBrokerTransport as createDurableObjectBrokerTransportDecl} from '@synclets/@types/durable-object';
import {getUniqueId} from '@synclets/utils';
import {getBrokerFunctions} from '../common/broker.ts';
import {objValues} from '../common/object.ts';
import {ifNotUndefined} from '../common/other.ts';
import {EMPTY_STRING, strMatch, strTest} from '../common/string.ts';
import {createDurableObjectTransport, createResponse} from './common.ts';

export const createDurableObjectBrokerTransport: typeof createDurableObjectBrokerTransportDecl =
  ({path = EMPTY_STRING, brokerPaths = /.*/, ...options}) => {
    let handleSendPacket: ((packet: string) => void) | undefined;
    let handleClose: (() => void) | undefined;
    let connected = false;

    const [addConnection, getReceive, clearConnections] = getBrokerFunctions();

    const getValidPath = ({
      url = EMPTY_STRING,
    }: {
      url?: string;
    }): string | undefined =>
      ifNotUndefined(
        strMatch(new URL(url, 'http://localhost').pathname ?? '/', /\/([^?]*)/),
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
        addConnection(clientId, webSocket, path);
        ctx.acceptWebSocket(webSocket, [clientId, path]);
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
      clearConnections();
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
