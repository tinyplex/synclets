/// durable-object

import {DurableObject} from 'cloudflare:workers';
import type {
  Address,
  Atom,
  Context,
  Data,
  DataConnector,
  LogLevel,
  Meta,
  MetaConnector,
  SyncletComponents,
  SyncletImplementations,
  SyncletOptions,
  Transport,
} from '../index.d.ts';

/// SyncletDurableObject
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
  /// SyncletDurableObject.constructor
  constructor(ctx: DurableObjectState, env: Env);

  /// SyncletDurableObject.getCreateComponents
  getCreateComponents?(): SyncletComponents<
    Depth,
    DataConnectorType,
    MetaConnectorType
  >;

  /// SyncletDurableObject.getCreateImplementations
  getCreateImplementations?(): SyncletImplementations<Depth>;

  /// SyncletDurableObject.getCreateOptions
  getCreateOptions?(): SyncletOptions;

  /// SyncletDurableObject.fetch
  fetch(request: Request): Promise<Response>;

  /// SyncletDurableObject.log
  log(message: string, level?: LogLevel): void;

  /// SyncletDurableObject.start
  start(): Promise<void>;

  /// SyncletDurableObject.stop
  stop(): Promise<void>;

  /// SyncletDurableObject.isStarted
  isStarted(): boolean;

  /// SyncletDurableObject.destroy
  destroy(): Promise<void>;

  /// SyncletDurableObject.getDataConnector
  getDataConnector(): DataConnectorType | undefined;

  /// SyncletDurableObject.getMetaConnector
  getMetaConnector(): MetaConnectorType | undefined;

  /// SyncletDurableObject.getTransport
  getTransport(): Transport[];

  /// SyncletDurableObject.sync
  sync(address: Address): Promise<void>;

  /// SyncletDurableObject.setAtom
  setAtom(
    address: Address,
    atom: Atom,
    context?: Context,
    sync?: boolean,
  ): Promise<void>;

  /// SyncletDurableObject.delAtom
  delAtom(address: Address, context?: Context, sync?: boolean): Promise<void>;

  /// SyncletDurableObject.getData
  getData(): Promise<Readonly<Data>>;

  /// SyncletDurableObject.getMeta
  getMeta(): Promise<Readonly<Meta>>;
}

/// PureBrokerDurableObject
export class PureBrokerDurableObject<
  Env = unknown,
> extends SyncletDurableObject<Env> {}

/// getSyncletDurableObjectFetch
export function getSyncletDurableObjectFetch<Namespace extends string>(
  namespace: Namespace,
): (
  request: Request,
  env: {
    [namespace in Namespace]: DurableObjectNamespace<SyncletDurableObject>;
  },
) => Response;
