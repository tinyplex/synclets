import {createTransport} from '@synclets';
import {ExtraMembers, TransportImplementations} from '@synclets/@types';
import {
  DurableObjectTransport,
  DurableObjectTransportOptions,
} from '@synclets/@types/durable-object';

export const createDurableObjectTransport = (
  {attach, detach, sendPacket}: TransportImplementations,
  {
    fetch,
    webSocketMessage,
    webSocketClose,
    webSocketError,
  }: {
    fetch: (
      ctx: DurableObjectState,
      request: Request,
    ) => Promise<Response | undefined>;
    webSocketMessage: (
      ctx: DurableObjectState,
      webSocket: WebSocket,
      message: ArrayBuffer | string,
    ) => Promise<boolean | undefined>;
    webSocketClose: (
      ctx: DurableObjectState,
      webSocket: WebSocket,
    ) => Promise<boolean | undefined>;
    webSocketError: (
      ctx: DurableObjectState,
      webSocket: WebSocket,
      error: any,
    ) => Promise<boolean | undefined>;
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
