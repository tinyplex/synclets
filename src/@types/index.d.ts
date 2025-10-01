/// synclets

type OneLonger<Than extends string[] = []> = [string, ...Than];
type LeafAddressFor<
  Depth extends number,
  Address extends string[] = [],
> = Address['length'] extends Depth
  ? Address
  : LeafAddressFor<Depth, OneLonger<Address>>;
type ParentAddressFor<
  Depth extends number,
  Address extends string[] = [],
> = OneLonger<Address>['length'] extends Depth
  ? Address
  : ParentAddressFor<Depth, OneLonger<Address>>;
type AncestorAddressFor<
  Depth extends number,
  Address extends string[] = [],
> = OneLonger<Address>['length'] extends Depth
  ? Address
  : Address | ParentAddressFor<Depth, [string, ...Address]>;
type AnyAddressFor<Depth extends number> =
  | LeafAddressFor<Depth>
  | AncestorAddressFor<Depth>;

import type {Tomb} from './utils/index.d.ts';

export type Address = string[];

export type Atom = string | number | boolean | null | Tomb;

export type Atoms = {[id: string]: Atom};

export type Data = Atoms | {[id: string]: Data};

export type Timestamps = {[id: string]: Timestamp};

export type Meta = Timestamps | {[id: string]: Meta};

export type Timestamp = string;

export type Hash = number;

export type TimestampAndAtom = [timestamp: Timestamp, atom: Atom | undefined];

export type Context = {[key: string]: Atom};

export type Logger = {
  error?: (string: string) => void;
  warn?: (string: string) => void;
  info?: (string: string) => void;
  debug?: (string: string) => void;
};
export type LogLevel = keyof Logger;

export interface Synclet<Depth extends number> {
  log(message: string, level?: LogLevel): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  isStarted(): boolean;
  destroy(): Promise<void>;
  getDataConnector(): DataConnector<Depth>;
  getMetaConnector(): MetaConnector<Depth>;
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

export type SyncletImplementations = {
  canReceiveMessage?: (context: Context) => Promise<boolean>;
  getSendContext?: (receivedContext?: Context) => Promise<Context>;
};

export type SyncletOptions = {
  id?: string;
  logger?: Logger;
};

export function createSynclet<Depth extends number>(
  dataConnector: DataConnector<Depth>,
  metaConnector: NoInfer<MetaConnector<Depth>>,
  transport: Transport | Transport[],
  implementations?: SyncletImplementations,
  options?: SyncletOptions,
): Promise<Synclet<Depth>>;

// --

export interface DataConnector<Depth extends number> {
  _brand: 'DataConnector';
  depth: Depth;
  log(message: string, level?: LogLevel): void;
}

export type DataConnectorImplementations<
  Depth extends number,
  AtomAddress = LeafAddressFor<Depth>,
  ParentAddress = ParentAddressFor<Depth>,
  AncestorAddress = AncestorAddressFor<Depth>,
> = {
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  readAtom: (
    address: AtomAddress,
    context: Context,
  ) => Promise<Atom | undefined>;
  writeAtom: (
    address: AtomAddress,
    atom: Atom,
    context: Context,
  ) => Promise<void>;
  removeAtom: (address: AtomAddress, context: Context) => Promise<void>;
  readChildIds: (
    address: AncestorAddress,
    context: Context,
  ) => Promise<string[]>;
  readAtoms: (address: ParentAddress, context: Context) => Promise<Atoms>;
};

export type DataConnectorOptimizations = {
  getData?: () => Promise<Data>;
};

export function createDataConnector<Depth extends number>(
  depth: Depth,
  implementations: DataConnectorImplementations<Depth>,
  optimizations?: DataConnectorOptimizations,
): Promise<DataConnector<Depth>>;

// --

export interface MetaConnector<Depth extends number> {
  _brand: 'MetaConnector';
  depth: Depth;
  log(message: string, level?: LogLevel): void;
}

export type MetaConnectorImplementations<
  Depth extends number,
  TimestampAddress = LeafAddressFor<Depth>,
  ParentAddress = ParentAddressFor<Depth>,
  AncestorAddress = AncestorAddressFor<Depth>,
> = {
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  readTimestamp: (
    address: TimestampAddress,
    context: Context,
  ) => Promise<Timestamp | undefined>;
  writeTimestamp: (
    address: TimestampAddress,
    timestamp: Timestamp,
    context: Context,
  ) => Promise<void>;
  readChildIds: (
    address: AncestorAddress,
    context: Context,
  ) => Promise<string[]>;
  readTimestamps: (
    address: ParentAddress,
    context: Context,
  ) => Promise<Timestamps>;
};

export type MetaConnectorOptimizations = {
  getMeta?: () => Promise<Meta>;
};

export function createMetaConnector<Depth extends number>(
  depth: Depth,
  implementations: MetaConnectorImplementations<Depth>,
  optimizations?: MetaConnectorOptimizations,
): Promise<MetaConnector<Depth>>;

// --

export interface Transport {
  _brand: 'Transport';
  log(message: string, level?: LogLevel): void;
}

export type TransportImplementations = {
  connect?: (receivePacket: (string: string) => Promise<void>) => Promise<void>;
  disconnect?: () => Promise<void>;
  sendPacket: (string: string) => Promise<void>;
};

export type TransportOptions = {
  fragmentSize?: number;
};

export function createTransport(
  implementations: TransportImplementations,
  options?: TransportOptions,
): Promise<Transport>;

export function getPartsFromPacket(packet: string): [to: string, body: string];

export function getPacketFromParts(to: string, body: string): string;
