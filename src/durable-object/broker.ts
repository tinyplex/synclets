import {createTransport} from '@synclets';
import {
  createDurableObjectBrokerTransport as createDurableObjectBrokerTransportDecl,
  DurableObjectBrokerTransport,
} from '@synclets/@types/durable-object';
import {arrayForEach} from '../common/array.ts';
import {objValues} from '../common/object.ts';
import {ifNotNull, ifNotUndefined, slice} from '../common/other.ts';
import {ASTERISK, SPACE} from '../common/string.ts';
import {
  createResponse,
  createUpgradeRequiredResponse,
  getClientId,
  getPathId,
} from './common.ts';
import {SyncletDurableObject} from './synclet.ts';

export const createDurableObjectBrokerTransport: typeof createDurableObjectBrokerTransportDecl =
  ({durableObject, path, brokerPaths, ...options}) => {
    const _ = {
      durableObject,
      path,
      brokerPaths,
    };

    const connect = async (
      _receivePacket: (packet: string) => Promise<void>,
    ): Promise<void> => {};

    const disconnect = async () => {};

    const sendPacket = async (_packet: string): Promise<void> => {};

    return createTransport(
      {connect, disconnect, sendPacket},
      options,
    ) as DurableObjectBrokerTransport;
  };

export class BrokerOnlyDurableObject<
  Env = unknown,
> extends SyncletDurableObject<Env> {
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
