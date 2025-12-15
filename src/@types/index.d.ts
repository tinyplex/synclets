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
  readonly error?: (string: string) => void;

  /// Logger.warn
  readonly warn?: (string: string) => void;

  /// Logger.info
  readonly info?: (string: string) => void;

  /// Logger.debug
  readonly debug?: (string: string) => void;
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
  getDataConnector(): DataConnectorType | undefined;

  /// Synclet.getMetaConnector
  getMetaConnector(): MetaConnectorType | undefined;

  /// Synclet.getTransport
  getTransport(): Transport[];

  /// Synclet.sync
  sync(address?: Address): Promise<void>;

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
  readonly dataConnector?: DataConnectorType;

  /// SyncletComponents.metaConnector
  readonly metaConnector?: MetaConnectorType;

  /// SyncletComponents.transport
  readonly transport?: Transport | Transport[];
};

/// SyncletImplementations
export type SyncletImplementations<Depth extends number> = {
  /// SyncletImplementations.onStart
  readonly onStart?: () => Promise<void>;

  /// SyncletImplementations.onStop
  readonly onStop?: () => Promise<void>;

  /// SyncletImplementations.onSync
  readonly onSync?: (address: AnyAddress<Depth>) => Promise<void>;

  /// SyncletImplementations.onSendMessage
  readonly onSendMessage?: (message: Message, to?: string) => Promise<void>;

  /// SyncletImplementations.onReceiveMessage
  readonly onReceiveMessage?: (message: Message, from: string) => Promise<void>;

  /// SyncletImplementations.onSetAtom
  readonly onSetAtom?: (address: AtomAddress<Depth>) => Promise<void>;

  /// SyncletImplementations.getSendContext
  readonly getSendContext?: (receivedContext?: Context) => Promise<Context>;

  /// SyncletImplementations.canReceiveMessage
  readonly canReceiveMessage?: (context: Context) => Promise<boolean>;

  /// SyncletImplementations.canReadAtom
  readonly canReadAtom?: (
    address: AtomAddress<Depth>,
    context: Context,
  ) => Promise<boolean>;

  /// SyncletImplementations.canWriteAtom
  readonly canWriteAtom?: (
    address: AtomAddress<Depth>,
    atom: Atom,
    context: Context,
  ) => Promise<boolean>;

  /// SyncletImplementations.canRemoveAtom
  readonly canRemoveAtom?: (
    address: AtomAddress<Depth>,
    context: Context,
  ) => Promise<boolean>;

  /// SyncletImplementations.filterChildIds
  readonly filterChildIds?: (
    address: AnyParentAddress<Depth>,
    childIds: string[],
    context: Context,
  ) => Promise<string[]>;

  /// SyncletImplementations.getNow
  readonly getNow?: () => number;
};

/// SyncletOptions
export type SyncletOptions = {
  /// SyncletOptions.id
  readonly id?: string;

  /// SyncletOptions.logger
  readonly logger?: Logger;
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

/// DataConnectorOptions
export type DataConnectorOptions<Depth extends number> = {
  /// DataConnectorOptions.depth
  readonly depth: Depth;
};

/// DataConnectorImplementations
export type DataConnectorImplementations<Depth extends number> = {
  /// DataConnectorImplementations.connect
  readonly connect?: (
    syncChangedAtoms: (...address: AtomAddress<Depth>[]) => Promise<void>,
  ) => Promise<void>;

  /// DataConnectorImplementations.disconnect
  readonly disconnect?: () => Promise<void>;

  /// DataConnectorImplementations.readAtom
  readonly readAtom: (address: AtomAddress<Depth>) => Promise<Atom | undefined>;

  /// DataConnectorImplementations.writeAtom
  readonly writeAtom: (
    address: AtomAddress<Depth>,
    atom: Atom,
  ) => Promise<void>;

  /// DataConnectorImplementations.removeAtom
  readonly removeAtom: (address: AtomAddress<Depth>) => Promise<void>;

  /// DataConnectorImplementations.readChildIds
  readonly readChildIds: (
    address: AnyParentAddress<Depth>,
  ) => Promise<string[]>;
};

/// DataConnectorOptimizations
export type DataConnectorOptimizations<Depth extends number> = {
  /// DataConnectorOptimizations.readAtoms
  readonly readAtoms?: (address: AtomsAddress<Depth>) => Promise<Atoms>;

  /// DataConnectorOptimizations.getData
  readonly getData?: () => Promise<Data>;
};

/// createDataConnector
export function createDataConnector<Depth extends number>(
  options: DataConnectorOptions<Depth>,
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

/// MetaConnectorOptions
export type MetaConnectorOptions<Depth extends number> = {
  /// MetaConnectorOptions.depth
  readonly depth: Depth;
};

/// MetaConnectorImplementations
export type MetaConnectorImplementations<Depth extends number> = {
  /// MetaConnectorImplementations.connect
  readonly connect?: () => Promise<void>;

  /// MetaConnectorImplementations.disconnect
  readonly disconnect?: () => Promise<void>;

  /// MetaConnectorImplementations.readTimestamp
  readonly readTimestamp: (
    address: TimestampAddress<Depth>,
  ) => Promise<Timestamp | undefined>;

  /// MetaConnectorImplementations.writeTimestamp
  readonly writeTimestamp: (
    address: TimestampAddress<Depth>,
    timestamp: Timestamp,
  ) => Promise<void>;

  /// MetaConnectorImplementations.readChildIds
  readonly readChildIds: (
    address: AnyParentAddress<Depth>,
  ) => Promise<string[]>;
};

/// MetaConnectorOptimizations
export type MetaConnectorOptimizations<Depth extends number> = {
  /// MetaConnectorOptimizations.readTimestamps
  readonly readTimestamps?: (
    address: TimestampsAddress<Depth>,
  ) => Promise<Timestamps>;

  /// MetaConnectorOptimizations.getMeta
  readonly getMeta?: () => Promise<Meta>;
};

/// createMetaConnector
export function createMetaConnector<Depth extends number>(
  options: MetaConnectorOptions<Depth>,
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
  readonly connect?: (
    receivePacket: (string: string) => Promise<void>,
  ) => Promise<void>;

  /// TransportImplementations.disconnect
  readonly disconnect?: () => Promise<void>;

  /// TransportImplementations.sendPacket
  readonly sendPacket: (string: string) => Promise<void>;
};

/// TransportOptions
export type TransportOptions = {
  /// TransportOptions.fragmentSize
  readonly fragmentSize?: number;
};

/// createTransport
export function createTransport(
  implementations: TransportImplementations,
  options?: TransportOptions,
): Transport;
