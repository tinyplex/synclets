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
  /// Message.version
  version: number,

  /// Message.type
  type: MessageType,

  /// Message.depth
  depth: number,

  /// Message.address
  address: Address,

  /// Message.node
  node: MessageNode,

  /// Message.context
  context: Context,
];

/// Context
export type Context = {[key: string]: Atom};

/// ExtraFunctions
export type ExtraFunctions = {[name: string]: (...args: any[]) => any};

/// Logger
export type Logger = {
  /// Logger.error
  error?: (string: string) => void;

  /// Logger.warn
  warn?: (string: string) => void;

  /// Logger.info
  info?: (string: string) => void;

  /// Logger.debug
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

/// Connectors
export type Connectors<
  Depth extends number,
  DataConnectorType extends DataConnector<Depth>,
  MetaConnectorType extends MetaConnector<Depth>,
> = [
  /// Connectors.dataConnector
  dataConnector: DataConnectorType,

  /// Connectors.metaConnector
  metaConnector: MetaConnectorType,
];

/// SyncletComponents
export type SyncletComponents<
  Depth extends number,
  DataConnectorType extends DataConnector<Depth>,
  MetaConnectorType extends MetaConnector<Depth>,
> = {
  /// SyncletComponents.connectors
  connectors?: Connectors<Depth, DataConnectorType, MetaConnectorType>;

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
  /// DataConnector._brand
  _brand: 'DataConnector';

  /// DataConnector.depth
  depth: Depth;

  /// DataConnector.log
  log(message: string, level?: LogLevel): void;
}

/// DataConnectorImplementations
export type DataConnectorImplementations<Depth extends number> = {
  /// DataConnectorImplementations.connect
  connect?: (
    syncChangedAtoms: (...address: AtomAddress<Depth>[]) => Promise<void>,
  ) => Promise<void>;

  /// DataConnectorImplementations.disconnect
  disconnect?: () => Promise<void>;

  /// DataConnectorImplementations.readAtom
  readAtom: (address: AtomAddress<Depth>) => Promise<Atom | undefined>;

  /// DataConnectorImplementations.writeAtom
  writeAtom: (address: AtomAddress<Depth>, atom: Atom) => Promise<void>;

  /// DataConnectorImplementations.removeAtom
  removeAtom: (address: AtomAddress<Depth>) => Promise<void>;

  /// DataConnectorImplementations.readChildIds
  readChildIds: (address: AnyParentAddress<Depth>) => Promise<string[]>;
};

/// DataConnectorOptimizations
export type DataConnectorOptimizations<Depth extends number> = {
  /// DataConnectorOptimizations.readAtoms
  readAtoms?: (address: AtomsAddress<Depth>) => Promise<Atoms>;

  /// DataConnectorOptimizations.getData
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
  /// MetaConnector._brand
  _brand: 'MetaConnector';

  /// MetaConnector.depth
  depth: Depth;

  /// MetaConnector.log
  log(message: string, level?: LogLevel): void;
}

/// MetaConnectorImplementations
export type MetaConnectorImplementations<Depth extends number> = {
  /// MetaConnectorImplementations.connect
  connect?: () => Promise<void>;

  /// MetaConnectorImplementations.disconnect
  disconnect?: () => Promise<void>;

  /// MetaConnectorImplementations.readTimestamp
  readTimestamp: (
    address: TimestampAddress<Depth>,
  ) => Promise<Timestamp | undefined>;

  /// MetaConnectorImplementations.writeTimestamp
  writeTimestamp: (
    address: TimestampAddress<Depth>,
    timestamp: Timestamp,
  ) => Promise<void>;

  /// MetaConnectorImplementations.readChildIds
  readChildIds: (address: AnyParentAddress<Depth>) => Promise<string[]>;
};

/// MetaConnectorOptimizations
export type MetaConnectorOptimizations<Depth extends number> = {
  /// MetaConnectorOptimizations.readTimestamps
  readTimestamps?: (address: TimestampsAddress<Depth>) => Promise<Timestamps>;

  /// MetaConnectorOptimizations.getMeta
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
  /// Transport._brand
  _brand: 'Transport';

  /// Transport.log
  log(message: string, level?: LogLevel): void;
}

/// TransportImplementations
export type TransportImplementations = {
  /// TransportImplementations.connect
  connect?: (receivePacket: (string: string) => Promise<void>) => Promise<void>;

  /// TransportImplementations.disconnect
  disconnect?: () => Promise<void>;

  /// TransportImplementations.sendPacket
  sendPacket: (string: string) => Promise<void>;
};

/// TransportOptions
export type TransportOptions = {
  /// TransportOptions.fragmentSize
  fragmentSize?: number;
};

/// createTransport
export function createTransport(
  implementations: TransportImplementations,
  options?: TransportOptions,
): Transport;
