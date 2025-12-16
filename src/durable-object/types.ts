import {DurableObjectTransport} from '@synclets/@types/durable-object';

export interface ProtectedDurableObjectTransport extends DurableObjectTransport {
  __: [fetch: (request: Request) => Promise<Response | undefined>];
}
