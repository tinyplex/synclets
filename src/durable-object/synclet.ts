import {DurableObject} from 'cloudflare:workers';
import {
  createUpgradeRequiredResponse,
  getClientId,
  getPathId,
} from './common.ts';

export class SyncletDurableObject<Env = unknown>
  extends DurableObject<Env>
  implements DurableObject<Env> {}

export const getSyncletDurableObjectFetch =
  <Namespace extends string>(namespace: Namespace) =>
  (
    request: Request,
    env: {
      [namespace in Namespace]: DurableObjectNamespace<SyncletDurableObject>;
    },
  ) =>
    getClientId(request)
      ? env[namespace]
          .get(env[namespace].idFromName(getPathId(request)))
          .fetch(request)
      : createUpgradeRequiredResponse();
