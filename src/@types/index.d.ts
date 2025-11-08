/// synclets

/// RESERVED
export const RESERVED: '\uFFFA';

/// Reserved
export type Reserved = typeof RESERVED;

/// UNDEFINED
export const UNDEFINED: '\uFFFC';

/// Undefined
export type Undefined = typeof UNDEFINED;

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

/// TimestampAndAtom
export type TimestampAndAtom = [timestamp: Timestamp, atom: Atom | undefined];

/// Hash
export type Hash = number;

/// MessageType
export type MessageType = 0;

/// MessageNode
export type MessageNode = Timestamp | TimestampAndAtom | Hash | MessageNodes;

/// MessageNodes
export type MessageNodes = [subNodes: {[id: string]: MessageNode}, partial?: 1];

/// Message
export type Message = [
  version: number,
  type: MessageType,
  depth: number,
  address: Address,
  node: MessageNode,
  context: Context,
];

/// Context
export type Context = {[key: string]: Atom};

/// ExtraFunctions
export type ExtraFunctions = {[name: string]: (...args: any[]) => any};

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
  /// Synclet.log
  log(message: string, level?: LogLevel): void;

  /// Synclet.start
  start(): Promise<void>;

  /// Synclet.stop
  stop(): Promise<void>;

  /// Synclet.isStarted
  isStarted(): boolean;

  /// Synclet.destroy
  destroy(): Promise<void>;

  /// Synclet.getDataConnector
  getDataConnector(): DataConnectorType;

  /// Synclet.getMetaConnector
  getMetaConnector(): MetaConnectorType;

  /// Synclet.getTransport
  getTransport(): Transport[];

  /// Synclet.sync
  sync(address: Address): Promise<void>;

  /// Synclet.setAtom
  setAtom(
    address: Address,
    atom: Atom,
    context?: Context,
    sync?: boolean,
  ): Promise<void>;

  /// Synclet.delAtom
  delAtom(address: Address, context?: Context, sync?: boolean): Promise<void>;

  /// Synclet.getData
  getData(): Promise<Readonly<Data>>;

  /// Synclet.getMeta
  getMeta(): Promise<Readonly<Meta>>;
}

/// SyncletComponents
export type SyncletComponents<
  Depth extends number,
  DataConnectorType extends DataConnector<Depth>,
  MetaConnectorType extends MetaConnector<Depth>,
> = {
  /// SyncletComponents.dataConnector
  dataConnector?: DataConnectorType;

  /// SyncletComponents.metaConnector
  metaConnector?: MetaConnectorType;

  /// SyncletComponents.transport
  transport?: Transport | Transport[];
};

/// SyncletImplementations
export type SyncletImplementations<Depth extends number> = {
  /// SyncletImplementations.onStart
  onStart?: () => Promise<void>;

  /// SyncletImplementations.onStop
  onStop?: () => Promise<void>;

  /// SyncletImplementations.onSync
  onSync?: (address: AnyAddress<Depth>) => Promise<void>;

  /// SyncletImplementations.onSendMessage
  onSendMessage?: (message: Message, to?: string) => Promise<void>;

  /// SyncletImplementations.onReceiveMessage
  onReceiveMessage?: (message: Message, from: string) => Promise<void>;

  /// SyncletImplementations.onSetAtom
  onSetAtom?: (address: AtomAddress<Depth>) => Promise<void>;

  /// SyncletImplementations.getSendContext
  getSendContext?: (receivedContext?: Context) => Promise<Context>;

  /// SyncletImplementations.canReceiveMessage
  canReceiveMessage?: (context: Context) => Promise<boolean>;

  /// SyncletImplementations.canReadAtom
  canReadAtom?: (
    address: AtomAddress<Depth>,
    context: Context,
  ) => Promise<boolean>;

  /// SyncletImplementations.canWriteAtom
  canWriteAtom?: (
    address: AtomAddress<Depth>,
    atom: Atom,
    context: Context,
  ) => Promise<boolean>;

  /// SyncletImplementations.canRemoveAtom
  canRemoveAtom?: (
    address: AtomAddress<Depth>,
    context: Context,
  ) => Promise<boolean>;

  /// SyncletImplementations.filterChildIds
  filterChildIds?: (
    address: AnyParentAddress<Depth>,
    childIds: string[],
    context: Context,
  ) => Promise<string[]>;

  /// SyncletImplementations.getNow
  getNow?: () => number;
};

/// SyncletOptions
export type SyncletOptions = {
  /// SyncletOptions.id
  id?: string;

  /// SyncletOptions.logger
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
  connect?: (
    syncChangedAtoms: (...address: AtomAddress<Depth>[]) => Promise<void>,
  ) => Promise<void>;
  disconnect?: () => Promise<void>;
  readAtom: (address: AtomAddress<Depth>) => Promise<Atom | undefined>;
  writeAtom: (address: AtomAddress<Depth>, atom: Atom) => Promise<void>;
  removeAtom: (address: AtomAddress<Depth>) => Promise<void>;
  readChildIds: (address: AnyParentAddress<Depth>) => Promise<string[]>;
};

/// DataConnectorOptimizations
export type DataConnectorOptimizations<Depth extends number> = {
  readAtoms?: (address: AtomsAddress<Depth>) => Promise<Atoms>;
  getData?: () => Promise<Data>;
};

/// createDataConnector
export function createDataConnector<Depth extends number>(
  depth: Depth,
  implementations: DataConnectorImplementations<Depth>,
  optimizations?: DataConnectorOptimizations<Depth>,
  extraFunctions?: ExtraFunctions,
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
  ) => Promise<Timestamp | undefined>;
  writeTimestamp: (
    address: TimestampAddress<Depth>,
    timestamp: Timestamp,
  ) => Promise<void>;
  readChildIds: (address: AnyParentAddress<Depth>) => Promise<string[]>;
};

/// MetaConnectorOptimizations
export type MetaConnectorOptimizations<Depth extends number> = {
  readTimestamps?: (address: TimestampsAddress<Depth>) => Promise<Timestamps>;
  getMeta?: () => Promise<Meta>;
};

/// createMetaConnector
export function createMetaConnector<Depth extends number>(
  depth: Depth,
  implementations: MetaConnectorImplementations<Depth>,
  optimizations?: MetaConnectorOptimizations<Depth>,
  extraFunctions?: ExtraFunctions,
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
