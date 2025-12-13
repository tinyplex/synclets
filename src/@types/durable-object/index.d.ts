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

/// DurableObjectStorageDataConnectorOptions
export type DurableObjectStorageDataConnectorOptions<Depth extends number> = {
  /// DurableObjectStorageDataConnectorOptions.depth
  readonly depth: Depth;
  /// DurableObjectStorageDataConnectorOptions.storage
  readonly storage: DurableObjectStorage;
  /// DurableObjectStorageDataConnectorOptions.dataTable
  readonly dataTable?: string;
  /// DurableObjectStorageDataConnectorOptions.addressColumn
  readonly addressColumn?: string;
  /// DurableObjectStorageDataConnectorOptions.atomColumn
  readonly atomColumn?: string;
};

/// DurableObjectStorageMetaConnectorOptions
export type DurableObjectStorageMetaConnectorOptions<Depth extends number> = {
  /// DurableObjectStorageMetaConnectorOptions.depth
  readonly depth: Depth;
  /// DurableObjectStorageMetaConnectorOptions.storage
  readonly storage: DurableObjectStorage;
  /// DurableObjectStorageMetaConnectorOptions.metaTable
  readonly metaTable?: string;
  /// DurableObjectStorageMetaConnectorOptions.addressColumn
  readonly addressColumn?: string;
  /// DurableObjectStorageMetaConnectorOptions.timestampColumn
  readonly timestampColumn?: string;
};

/// DurableObjectStorageDataConnector
export type DurableObjectStorageDataConnector<Depth extends number> =
  DataConnector<Depth> & {
    /// DurableObjectStorageDataConnector.getStorage
    getStorage(): DurableObjectStorage;
  };

/// DurableObjectStorageMetaConnector
export type DurableObjectStorageMetaConnector<Depth extends number> =
  MetaConnector<Depth> & {
    /// DurableObjectStorageMetaConnector.getStorage
    getStorage(): DurableObjectStorage;
  };

/// createDurableObjectStorageDataConnector
export function createDurableObjectStorageDataConnector<Depth extends number>(
  options: DurableObjectStorageDataConnectorOptions<Depth>,
): DurableObjectStorageDataConnector<Depth>;

/// createDurableObjectStorageMetaConnector
export function createDurableObjectStorageMetaConnector<Depth extends number>(
  options: DurableObjectStorageMetaConnectorOptions<Depth>,
): DurableObjectStorageMetaConnector<Depth>;

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
