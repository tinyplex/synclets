import {DurableObject} from 'cloudflare:workers';
import {arrayForEach} from '../../common/array.ts';
import {objValues} from '../../common/object.ts';
import {ifNotNull, ifNotUndefined, slice} from '../../common/other.ts';
import {ASTERISK, EMPTY_STRING, SPACE, strMatch} from '../../common/string.ts';

const PATH_REGEX = /\/([^?]*)/;

const getPathId = (request: Request): string =>
  strMatch(new URL(request.url).pathname, PATH_REGEX)?.[1] ?? EMPTY_STRING;

const getClientId = (request: Request): string | null =>
  request.headers.get('upgrade')?.toLowerCase() == 'websocket'
    ? request.headers.get('sec-websocket-key')
    : null;

const createResponse = (
  status: number,
  webSocket: WebSocket | null = null,
  body: string | null = null,
): Response => new Response(body, {status, webSocket});

const createUpgradeRequiredResponse = (): Response =>
  createResponse(426, null, 'Upgrade required');

export class SyncletDurableObject<Env = unknown>
  extends DurableObject<Env>
  implements DurableObject<Env>
{
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  fetch(request: Request): Response {
    const pathId = getPathId(request);
    return ifNotNull(
      getClientId(request),
      (clientId) => {
        const [webSocket, client] = objValues(new WebSocketPair());
        this.ctx.acceptWebSocket(client, [clientId, pathId]);
        return createResponse(101, webSocket);
      },
      createUpgradeRequiredResponse,
    ) as Response;
  }

  webSocketMessage(client: WebSocket, message: ArrayBuffer | string) {
    ifNotUndefined(this.ctx.getTags(client)[0], (clientId) =>
      this.#handleMessage(clientId, message.toString(), client),
    );
  }

  webSocketClose(_client: WebSocket) {}

  #handleMessage(id: string, packet: string, fromClient?: WebSocket) {
    const splitAt = packet.indexOf(SPACE);
    if (splitAt !== -1) {
      const to = slice(packet, 0, splitAt);
      const remainder = slice(packet, splitAt + 1);
      const forwardedPacket = id + SPACE + remainder;
      if (to === ASTERISK) {
        arrayForEach(this.#getClients(), (otherClient) =>
          otherClient !== fromClient ? otherClient.send(forwardedPacket) : 0,
        );
      } else if (to != id) {
        this.#getClients(to)[0]?.send(forwardedPacket);
      }
    }
  }

  #getClients(tag?: string) {
    return this.ctx.getWebSockets(tag);
  }
}

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
