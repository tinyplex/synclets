/// synclets

import type {Undefined} from './utils/index.d.ts';

/// Address
export type Address = string[];

/// AtomAddress
export type AtomAddress<Depth extends number> = LeafAddressFor<Depth>;

/// AtomsAddress
export type AtomsAddress<Depth extends number> = LeafParentAddressFor<Depth>;

/// TimestampAddress
export type TimestampAddress<Depth extends number> = LeafAddressFor<Depth>;

/// TimestampsAddress
export type TimestampsAddress<Depth extends number> =
  LeafParentAddressFor<Depth>;

/// AnyParentAddress
export type AnyParentAddress<Depth extends number> = AnyParentAddressFor<Depth>;

/// AnyAddress
export type AnyAddress<Depth extends number> =
  | AtomAddress<Depth>
  | TimestampAddress<Depth>
  | AnyParentAddress<Depth>;

/// Atom
export type Atom = string | number | boolean | null | Undefined;

/// Atoms
export type Atoms = {[id: string]: Atom};

/// Data
export type Data = Atoms | {[id: string]: Data};

/// Timestamp
export type Timestamp = string;

/// Timestamps
export type Timestamps = {[id: string]: Timestamp};

/// Meta
export type Meta = Timestamps | {[id: string]: Meta};

/// Context
export type Context = {[key: string]: Atom};

/// Logger
export type Logger = {
  error?: (string: string) => void;
  warn?: (string: string) => void;
  info?: (string: string) => void;
  debug?: (string: string) => void;
};

/// LogLevel
export type LogLevel = keyof Logger;

/// Synclet
export interface Synclet<
  Depth extends number,
  DataConnectorType extends DataConnector<Depth> = DataConnector<Depth>,
  MetaConnectorType extends MetaConnector<Depth> = MetaConnector<Depth>,
> {
  log(message: string, level?: LogLevel): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  isStarted(): boolean;
  destroy(): Promise<void>;
  getDataConnector(): DataConnectorType;
  getMetaConnector(): MetaConnectorType;
  getTransport(): Transport[];
  sync(address: Address): Promise<void>;
  setAtom(
    address: Address,
    atom: Atom,
    context?: Context,
    sync?: boolean,
  ): Promise<void>;
  delAtom(address: Address, context?: Context, sync?: boolean): Promise<void>;
  getData(): Promise<Readonly<Data>>;
  getMeta(): Promise<Readonly<Meta>>;
}

/// SyncletComponents
export type SyncletComponents<
  Depth extends number,
  DataConnectorType extends DataConnector<Depth>,
  MetaConnectorType extends MetaConnector<Depth>,
> = {
  dataConnector?: DataConnectorType;
  metaConnector?: MetaConnectorType;
  transport?: Transport | Transport[];
};

/// SyncletImplementations
export type SyncletImplementations<Depth extends number> = {
  onStart?: () => Promise<void>;
  onStop?: () => Promise<void>;
  onSync?: (address: AnyAddress<Depth>) => Promise<void>;
  onSetAtom?: (address: AtomAddress<Depth>) => Promise<void>;
  getSendContext?: (receivedContext?: Context) => Promise<Context>;
  canReceiveMessage?: (context: Context) => Promise<boolean>;
  canReadAtom?: (
    address: AtomAddress<Depth>,
    context: Context,
  ) => Promise<boolean>;
  canWriteAtom?: (
    address: AtomAddress<Depth>,
    atom: Atom,
    context: Context,
  ) => Promise<boolean>;
  canRemoveAtom?: (
    address: AtomAddress<Depth>,
    context: Context,
  ) => Promise<boolean>;
  filterChildIds?: (
    address: AnyParentAddress<Depth>,
    childIds: string[],
    context: Context,
  ) => Promise<string[]>;
};

/// SyncletOptions
export type SyncletOptions = {
  id?: string;
  logger?: Logger;
};

/// createSynclet
export function createSynclet<
  Depth extends number,
  DataConnectorType extends DataConnector<Depth>,
  MetaConnectorType extends MetaConnector<
    DataConnectorType extends DataConnector<infer Depth> ? Depth : never
  >,
>(
  components?: SyncletComponents<Depth, DataConnectorType, MetaConnectorType>,
  implementations?: SyncletImplementations<Depth>,
  options?: SyncletOptions,
): Promise<Synclet<Depth, DataConnectorType, MetaConnectorType>>;

// --

/// DataConnector
export interface DataConnector<Depth extends number> {
  _brand: 'DataConnector';
  depth: Depth;
  log(message: string, level?: LogLevel): void;
}

/// DataConnectorImplementations
export type DataConnectorImplementations<Depth extends number> = {
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  readAtom: (
    address: AtomAddress<Depth>,
    context: Context,
  ) => Promise<Atom | undefined>;
  writeAtom: (
    address: AtomAddress<Depth>,
    atom: Atom,
    context: Context,
  ) => Promise<void>;
  removeAtom: (address: AtomAddress<Depth>, context: Context) => Promise<void>;
  readChildIds: (
    address: AnyParentAddress<Depth>,
    context: Context,
  ) => Promise<string[]>;
  readAtoms: (address: AtomsAddress<Depth>, context: Context) => Promise<Atoms>;
};

/// DataConnectorOptimizations
export type DataConnectorOptimizations = {
  getData?: () => Promise<Data>;
};

/// createDataConnector
export function createDataConnector<Depth extends number>(
  depth: Depth,
  implementations: DataConnectorImplementations<Depth>,
  optimizations?: DataConnectorOptimizations,
): DataConnector<Depth>;

// --

/// MetaConnector
export interface MetaConnector<Depth extends number> {
  _brand: 'MetaConnector';
  depth: Depth;
  log(message: string, level?: LogLevel): void;
}

/// MetaConnectorImplementations
export type MetaConnectorImplementations<Depth extends number> = {
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  readTimestamp: (
    address: TimestampAddress<Depth>,
    context: Context,
  ) => Promise<Timestamp | undefined>;
  writeTimestamp: (
    address: TimestampAddress<Depth>,
    timestamp: Timestamp,
    context: Context,
  ) => Promise<void>;
  readChildIds: (
    address: AnyParentAddress<Depth>,
    context: Context,
  ) => Promise<string[]>;
  readTimestamps: (
    address: TimestampsAddress<Depth>,
    context: Context,
  ) => Promise<Timestamps>;
};

/// MetaConnectorOptimizations
export type MetaConnectorOptimizations = {
  getMeta?: () => Promise<Meta>;
};

/// createMetaConnector
export function createMetaConnector<Depth extends number>(
  depth: Depth,
  implementations: MetaConnectorImplementations<Depth>,
  optimizations?: MetaConnectorOptimizations,
): MetaConnector<Depth>;

// --

/// Transport
export interface Transport {
  _brand: 'Transport';
  log(message: string, level?: LogLevel): void;
}

/// TransportImplementations
export type TransportImplementations = {
  connect?: (receivePacket: (string: string) => Promise<void>) => Promise<void>;
  disconnect?: () => Promise<void>;
  sendPacket: (string: string) => Promise<void>;
};

/// TransportOptions
export type TransportOptions = {
  fragmentSize?: number;
};

/// createTransport
export function createTransport(
  implementations: TransportImplementations,
  options?: TransportOptions,
): Transport;
