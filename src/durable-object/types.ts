import {DurableObjectTransport} from '@synclets/@types/durable-object';

export interface ProtectedDurableObjectTransport extends DurableObjectTransport {
  __: [
    fetch: (
      ctx: DurableObjectState,
      request: Request,
    ) => Promise<Response | undefined>,
    webSocketMessage: (
      ctx: DurableObjectState,
      client: WebSocket,
      message: ArrayBuffer | string,
    ) => Promise<boolean | undefined>,
  ];
}
