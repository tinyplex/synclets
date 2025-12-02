/// transport/durable-object

import {DurableObject} from 'cloudflare:workers';

/// ServerDurableObject
export class ServerDurableObject<Env = unknown> extends DurableObject<Env> {
  /// ServerDurableObject.constructor
  constructor(ctx: DurableObjectState, env: Env);
}

/// getServerDurableObjectFetch
export function getServerDurableObjectFetch<Namespace extends string>(
  namespace: Namespace,
): (
  request: Request,
  env: {
    [namespace in Namespace]: DurableObjectNamespace<ServerDurableObject>;
  },
) => Response;
