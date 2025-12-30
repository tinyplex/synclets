/// durable-object

import {DurableObject} from 'cloudflare:workers';
import type {
  DatabaseDataConnectorOptions,
  DatabaseMetaConnectorOptions,
  TableSchema,
} from '../database/index.d.ts';
import type {
  Address,
  Atom,
  Context,
  Data,
  DataConnector,
  LogLevel,
  Meta,
  MetaConnector,
  SyncletImplementations,
  SyncletOptions,
  Transport,
  TransportOptions,
} from '../index.d.ts';

/// DurableObjectSqliteDataConnectorOptions
export type DurableObjectSqliteDataConnectorOptions<Depth extends number> = {
  /// DurableObjectSqliteDataConnectorOptions.sqlStorage
  readonly sqlStorage: SqlStorage;
} & DatabaseDataConnectorOptions<Depth>;

/// DurableObjectSqliteDataConnector
export type DurableObjectSqliteDataConnector<Depth extends number> =
  DataConnector<Depth> & {
    /// DurableObjectSqliteDataConnector.getSqlStorage
    getSqlStorage(): SqlStorage;
  };

/// createDurableObjectSqliteDataConnector
export function createDurableObjectSqliteDataConnector<
  const Depth extends number,
>(
  options: DurableObjectSqliteDataConnectorOptions<Depth>,
): DurableObjectSqliteDataConnector<Depth>;

/// DurableObjectSqliteMetaConnectorOptions
export type DurableObjectSqliteMetaConnectorOptions<Depth extends number> = {
  /// DurableObjectSqliteMetaConnectorOptions.sqlStorage
  readonly sqlStorage: SqlStorage;
} & DatabaseMetaConnectorOptions<Depth>;

/// DurableObjectSqliteMetaConnector
export type DurableObjectSqliteMetaConnector<Depth extends number> =
  MetaConnector<Depth> & {
    /// DurableObjectSqliteMetaConnector.getSqlStorage
    getSqlStorage(): SqlStorage;
  };

/// createDurableObjectSqliteMetaConnector
export function createDurableObjectSqliteMetaConnector<
  const Depth extends number,
>(
  options: DurableObjectSqliteMetaConnectorOptions<Depth>,
): DurableObjectSqliteMetaConnector<Depth>;

/// DurableObjectTransport
export interface DurableObjectTransport extends Transport {
  /// DurableObjectTransport._brand2
  _brand2: 'DurableObjectTransport';

  /// DurableObjectTransport.getDurableObject
  getDurableObject(): SyncletDurableObject;
}

/// DurableObjectTransportOptions
export type DurableObjectTransportOptions = {
  /// DurableObjectTransportOptions.durableObject
  readonly durableObject: SyncletDurableObject;
} & TransportOptions;

/// DurableObjectBrokerTransport
export interface DurableObjectBrokerTransport extends DurableObjectTransport {
  /// DurableObjectBrokerTransport.getPaths
  getPaths(): string[];
  /// DurableObjectBrokerTransport.getClientIds
  getClientIds(path: string): string[];
}

/// DurableObjectBrokerTransportOptions
export type DurableObjectBrokerTransportOptions = {
  /// DurableObjectBrokerTransportOptions.path
  readonly path?: string | null;

  /// DurableObjectBrokerTransportOptions.brokerPaths
  readonly brokerPaths?: RegExp;
} & DurableObjectTransportOptions;

/// createDurableObjectBrokerTransport
export function createDurableObjectBrokerTransport(
  options: DurableObjectBrokerTransportOptions,
): DurableObjectBrokerTransport;

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

  /// SyncletDurableObject.getCreateDataConnector
  getCreateDataConnector?(): DataConnectorType;

  /// SyncletDurableObject.getCreateMetaConnector
  getCreateMetaConnector?(): MetaConnectorType;

  /// SyncletDurableObject.getCreateTransport
  getCreateTransport?(): Transport | Transport[];

  /// SyncletDurableObject.getCreateImplementations
  getCreateImplementations?(): SyncletImplementations<Depth>;

  /// SyncletDurableObject.getCreateOptions
  getCreateOptions?(): SyncletOptions;

  /// SyncletDurableObject.fetch
  fetch(request: Request): Response | Promise<Response>;

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

/// BrokerOnlyDurableObject
export class BrokerOnlyDurableObject<
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
) => Promise<Response>;

/// durable-object.getTableSchema
export function getTableSchema(
  sqlStorage: SqlStorage,
  table: string,
): Promise<TableSchema>;
