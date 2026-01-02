import {DurableObjectTransport} from '@synclets/@types/durable-object';

export type TransportFetch = (
  ctx: DurableObjectState,
  request: Request,
) => Promise<Response | undefined>;

export type TransportWebSocketMessage = (
  ctx: DurableObjectState,
  webSocket: WebSocket,
  message: ArrayBuffer | string,
) => Promise<boolean | undefined>;

export type TransportWebSocketClose = (
  ctx: DurableObjectState,
  webSocket: WebSocket,
) => Promise<boolean | undefined>;

export type TransportWebSocketError = (
  ctx: DurableObjectState,
  webSocket: WebSocket,
  error: any,
) => Promise<boolean | undefined>;

export interface ProtectedDurableObjectTransport extends DurableObjectTransport {
  __: [
    fetch: TransportFetch,
    webSocketMessage: TransportWebSocketMessage,
    webSocketClose: TransportWebSocketClose,
    webSocketError: TransportWebSocketError,
  ];
}
