import type {
  Address,
  Atom,
  Context,
  Data,
  DataConnector,
  LogLevel,
  Meta,
  MetaConnector,
  Synclet,
  SyncletComponents,
  SyncletImplementations,
  SyncletOptions,
  Transport,
} from '@synclets/@types';
import {DurableObject} from 'cloudflare:workers';
import {arrayFilter} from '../common/array.ts';
import {isUndefined} from '../common/other.ts';
import {EMPTY_STRING} from '../common/string.ts';
import {createSynclet} from '../core/synclet.ts';
import {
  createNotImplementedResponse,
  createUpgradeRequiredResponse,
} from './common.ts';
import {ProtectedDurableObjectTransport} from './types.ts';

export abstract class SyncletDurableObject<
  Env = unknown,
  Depth extends number = number,
  DataConnectorType extends DataConnector<Depth> = DataConnector<Depth>,
  MetaConnectorType extends MetaConnector<
    DataConnectorType extends DataConnector<infer Depth> ? Depth : never
  > = MetaConnector<
    DataConnectorType extends DataConnector<infer Depth> ? Depth : never
  >,
> extends DurableObject<Env> {
  #synclet!: Synclet<Depth, DataConnectorType, MetaConnectorType>;
  #durableObjectTransports!: ProtectedDurableObjectTransport[];

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      this.#synclet = await createSynclet(
        {
          dataConnector: this.getCreateDataConnector?.(),
          metaConnector: this.getCreateMetaConnector?.(),
          transport: this.getCreateTransport?.(),
        } as SyncletComponents<Depth, DataConnectorType, MetaConnectorType>,
        this.getCreateImplementations?.(),
        this.getCreateOptions?.(),
      );
      this.#durableObjectTransports = arrayFilter(
        this.#synclet.getTransport() as ProtectedDurableObjectTransport[],
        (transport) =>
          '_brand2' in transport &&
          transport._brand2 === 'DurableObjectTransport' &&
          transport.getDurableObject() === this,
      );
    });
  }

  async fetch(request: Request): Promise<Response> {
    for (const {
      __: [fetch],
    } of this.#durableObjectTransports) {
      const response = await fetch(this.ctx, request);
      if (!isUndefined(response)) {
        return response;
      }
    }
    return createNotImplementedResponse();
  }

  async webSocketMessage(
    ws: WebSocket,
    message: string | ArrayBuffer,
  ): Promise<void> {
    for (const {
      __: [, webSocketMessage],
    } of this.#durableObjectTransports) {
      if (await webSocketMessage(this.ctx, ws, message)) {
        break;
      }
    }
  }

  getCreateDataConnector?(): DataConnectorType;

  getCreateMetaConnector?(): MetaConnectorType;

  getCreateTransport?(): Transport | Transport[];

  getCreateImplementations?(): SyncletImplementations<Depth>;

  getCreateOptions?(): SyncletOptions;

  log(message: string, level?: LogLevel): void {
    this.#synclet.log(message, level);
  }

  async start(): Promise<void> {
    await this.#synclet.start();
  }

  async stop(): Promise<void> {
    await this.#synclet.stop();
  }

  isStarted(): boolean {
    return this.#synclet.isStarted();
  }

  async destroy(): Promise<void> {
    await this.#synclet.destroy();
  }

  getDataConnector(): DataConnectorType | undefined {
    return this.#synclet.getDataConnector();
  }

  getMetaConnector(): MetaConnectorType | undefined {
    return this.#synclet.getMetaConnector();
  }

  getTransport(): Transport[] {
    return this.#synclet.getTransport();
  }

  async sync(address: Address): Promise<void> {
    await this.#synclet.sync(address);
  }

  async setAtom(
    address: Address,
    atom: Atom,
    context?: Context,
    sync?: boolean,
  ): Promise<void> {
    await this.#synclet.setAtom(address, atom, context, sync);
  }

  async delAtom(
    address: Address,
    context?: Context,
    sync?: boolean,
  ): Promise<void> {
    await this.#synclet.delAtom(address, context, sync);
  }

  async getData(): Promise<Readonly<Data>> {
    return await this.#synclet.getData();
  }

  async getMeta(): Promise<Readonly<Meta>> {
    return await this.#synclet.getMeta();
  }
}

export const getSyncletDurableObjectFetch =
  <Namespace extends string>(
    namespace: Namespace,
    name: string = EMPTY_STRING,
  ) =>
  (
    request: Request,
    env: {
      [namespace in Namespace]: DurableObjectNamespace<SyncletDurableObject>;
    },
  ): Promise<Response> =>
    request.method.toLowerCase() != 'get'
      ? createNotImplementedResponse()
      : request.headers.get('upgrade')?.toLowerCase() != 'websocket'
        ? createUpgradeRequiredResponse()
        : env[namespace].getByName(name).fetch(request);
