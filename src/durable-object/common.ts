import {createTransport} from '@synclets';
import {ExtraMembers, TransportImplementations} from '@synclets/@types';
import {
  DurableObjectTransport,
  DurableObjectTransportOptions,
} from '@synclets/@types/durable-object';

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
  extraMembers: ExtraMembers,
  {durableObject, ...options}: DurableObjectTransportOptions,
) => {
  const getDurableObject = () => durableObject;

  return createTransport({connect, disconnect, sendPacket}, options, {
    ...extraMembers,
    _brand2: 'DurableObjectTransport',
    __: [fetch, webSocketMessage],
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
