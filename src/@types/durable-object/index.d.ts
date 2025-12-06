/// durable-object

import {DurableObject} from 'cloudflare:workers';

/// SyncletDurableObject
export class SyncletDurableObject<Env = unknown> extends DurableObject<Env> {
  /// SyncletDurableObject.constructor
  constructor(ctx: DurableObjectState, env: Env);
}

/// getSyncletDurableObjectFetch
export function getSyncletDurableObjectFetch<Namespace extends string>(
  namespace: Namespace,
): (
  request: Request,
  env: {
    [namespace in Namespace]: DurableObjectNamespace<SyncletDurableObject>;
  },
) => Response;
