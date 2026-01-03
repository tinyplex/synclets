import {DurableObjectTransport} from '@synclets/@types/durable-object';

export type TransportFetch = (
  ctx: DurableObjectState,
  request: Request,
) => Promise<Response>;

export type TransportWebSocketMessage = (
  ctx: DurableObjectState,
  webSocket: WebSocket,
  message: ArrayBuffer | string,
) => Promise<void>;

export type TransportWebSocketClose = (
  ctx: DurableObjectState,
  webSocket: WebSocket,
) => Promise<void>;

export type TransportWebSocketError = (
  ctx: DurableObjectState,
  webSocket: WebSocket,
  error: any,
) => Promise<void>;

export interface ProtectedDurableObjectTransport extends DurableObjectTransport {
  __: [
    fetch: TransportFetch,
    webSocketMessage: TransportWebSocketMessage,
    webSocketClose: TransportWebSocketClose,
    webSocketError: TransportWebSocketError,
  ];
}
