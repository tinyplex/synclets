import {createDurableObjectBrokerTransport as createDurableObjectBrokerTransportDecl} from '@synclets/@types/durable-object';
import {getUniqueId} from '@synclets/utils';
import {getBrokerFunctions} from '../common/broker.ts';
import {objValues} from '../common/object.ts';
import {ifNotUndefined, isNull} from '../common/other.ts';
import {EMPTY_STRING, strMatch, strTest} from '../common/string.ts';
import {RESERVED} from '../core/constants.ts';
import {createDurableObjectTransport, createResponse} from './common.ts';

const SERVER_ID = RESERVED + 's';

export const createDurableObjectBrokerTransport: typeof createDurableObjectBrokerTransportDecl =
  ({path = EMPTY_STRING, brokerPaths = /.*/, ...options}) => {
    let handleSend: ((packet: string) => void) | undefined;
    let handleDel: (() => void) | undefined;
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
      receivePacket: (packet: string) => Promise<void>,
    ): Promise<void> => {
      connected = true;
      if (!isNull(path)) {
        const [_, send, del] = addConnection(
          SERVER_ID,
          {send: receivePacket},
          path,
        );
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
