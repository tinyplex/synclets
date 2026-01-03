import {createTransport} from '@synclets';
import {ExtraMembers, TransportImplementations} from '@synclets/@types';
import {
  DurableObjectTransport,
  DurableObjectTransportOptions,
} from '@synclets/@types/durable-object';
import {
  TransportFetch,
  TransportWebSocketClose,
  TransportWebSocketError,
  TransportWebSocketMessage,
} from './types.ts';

export const createDurableObjectTransport = (
  {attach, detach, sendPacket}: TransportImplementations,
  {
    fetch,
    webSocketMessage,
    webSocketClose,
    webSocketError,
  }: {
    fetch: TransportFetch;
    webSocketMessage: TransportWebSocketMessage;
    webSocketClose: TransportWebSocketClose;
    webSocketError: TransportWebSocketError;
  },
  extraMembers: ExtraMembers,
  {durableObject, ...options}: DurableObjectTransportOptions,
) => {
  const getDurableObject = () => durableObject;

  return createTransport({attach, detach, sendPacket}, options, {
    ...extraMembers,
    _brand2: 'DurableObjectTransport',
    __: [fetch, webSocketMessage, webSocketClose, webSocketError],
    getDurableObject,
  }) as DurableObjectTransport;
};

export const createResponse = (
  status: number,
  webSocket: WebSocket | null = null,
  body: string | null = null,
): Response => new Response(body, {status, webSocket});

export const createUpgradeRequiredResponse = async (): Promise<Response> =>
  createResponse(426, null, 'Upgrade Required');

export const createNotImplementedResponse = async (): Promise<Response> =>
  createResponse(501, null, 'Not Implemented');
