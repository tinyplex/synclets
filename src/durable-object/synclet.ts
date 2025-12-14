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
import {createSynclet} from '../core/synclet.ts';
import {
  createNotImplementedResponse,
  createUpgradeRequiredResponse,
  getClientId,
  getPathId,
} from './common.ts';

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

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      this.#synclet = await createSynclet(
        this.getCreateComponents?.(),
        this.getCreateImplementations?.(),
        this.getCreateOptions?.(),
      );
    });
  }

  fetch(_request: Request): Response {
    return createNotImplementedResponse();
  }

  getCreateComponents?(): SyncletComponents<
    Depth,
    DataConnectorType,
    MetaConnectorType
  >;

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
