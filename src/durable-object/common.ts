import {createTransport} from '@synclets';
import {TransportImplementations} from '@synclets/@types';
import {
  DurableObjectTransport,
  DurableObjectTransportOptions,
} from '@synclets/@types/durable-object';
import {EMPTY_STRING, strMatch} from '../common/string.ts';

const PATH_REGEX = /\/([^?]*)/;

export const createDurableObjectTransport = (
  {connect, disconnect, sendPacket}: TransportImplementations,
  {
    fetch,
    webSocketMessage,
  }: {
    fetch: (
      ctx: DurableObjectState,
      request: Request,
    ) => Promise<Response | undefined>;
    webSocketMessage?: (
      ctx: DurableObjectState,
      client: WebSocket,
      message: ArrayBuffer | string,
    ) => Promise<boolean | undefined>;
  },
  {durableObject, ...options}: DurableObjectTransportOptions,
) => {
  const getDurableObject = () => durableObject;

  return createTransport({connect, disconnect, sendPacket}, options, {
    _brand2: 'DurableObjectTransport',
    __: [fetch, webSocketMessage],
    getDurableObject,
  }) as DurableObjectTransport;
};

export const getPathId = (request: Request): string =>
  strMatch(new URL(request.url).pathname, PATH_REGEX)?.[1] ?? EMPTY_STRING;

export const getClientId = (
  upgrade: string | null | undefined,
  websocketKey: string | null | undefined,
): string | null =>
  upgrade?.toLowerCase() == 'websocket' ? (websocketKey ?? null) : null;

export const createResponse = (
  status: number,
  webSocket: WebSocket | null = null,
  body: string | null = null,
): Response => new Response(body, {status, webSocket});

export const createUpgradeRequiredResponse = async (): Promise<Response> =>
  createResponse(426, null, 'Upgrade Required');

export const createNotImplementedResponse = async (): Promise<Response> =>
  createResponse(501, null, 'Not Implemented');
