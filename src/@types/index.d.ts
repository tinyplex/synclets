/// synclets

import type {Tomb} from './utils/index.d.ts';

export type Atom = string | number | boolean | null | Tomb;

export type Data = Readonly<{[id: string]: Data | Atom}>;

export type Meta = Readonly<[hash: Hash, {[id: string]: Meta | Timestamp}]>;

export type Timestamp = string;

export type Hash = number;

export type Address = Readonly<string[]>;

export type ProtocolNode =
  | Timestamp
  | TimestampAndAtom
  | Hash
  | ProtocolSubNodes;

export type ProtocolSubNodes = [
  subNodes: {[id: string]: ProtocolNode},
  partial?: 1,
];

export type TimestampAndAtom = [timestamp: Timestamp, atom: Atom | undefined];

export type Context = {[key: string]: Atom};

export type Logger = {
  error?: (string: string) => void;
  warn?: (string: string) => void;
  info?: (string: string) => void;
  debug?: (string: string) => void;
};
export type LogLevel = keyof Logger;

export interface Synclet {
  log(message: string, level?: LogLevel): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  isStarted(): boolean;
  getDataConnector(): DataConnector;
  getMetaConnector(): MetaConnector;
  getTransport(): Transport[];
  sync(address: Address): Promise<void>;
  setAtom(
    address: Address,
    atom: Atom,
    context?: Context,
    sync?: boolean,
  ): Promise<void>;
  delAtom(address: Address, context?: Context, sync?: boolean): Promise<void>;
  getData(): Promise<Data>;
  getMeta(): Promise<Meta>;
}

export type SyncletImplementations = {
  canReceiveMessage?: (context: Context) => Promise<boolean>;
  getSendContext?: (receivedContext?: Context) => Promise<Context>;
};

export type SyncletOptions = {
  id?: string;
  logger?: Logger;
};

export function createSynclet(
  dataConnector: DataConnector,
  metaConnector: MetaConnector,
  transport: Transport | Transport[],
  implementations?: SyncletImplementations,
  options?: SyncletOptions,
): Promise<Synclet>;

// --

export interface DataConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export type DataConnectorImplementations = {
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  readAtom: (address: Address, context: Context) => Promise<Atom | undefined>;
  writeAtom: (address: Address, atom: Atom, context: Context) => Promise<void>;
  removeAtom: (address: Address, context: Context) => Promise<void>;
  readChildIds: (
    address: Address,
    context: Context,
  ) => Promise<string[] | undefined>;
};

export type DataConnectorOptimizations = {
  getData?: () => Promise<Data>;
};

export function createDataConnector(
  depth: number,
  implementations: DataConnectorImplementations,
  optimizations?: DataConnectorOptimizations,
): Promise<DataConnector>;

// --

export interface MetaConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export type MetaConnectorImplementations = {
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  readTimestamp: (
    address: Address,
    context: Context,
  ) => Promise<Timestamp | undefined>;
  readHash: (address: Address, context: Context) => Promise<Hash | undefined>;
  writeTimestamp: (
    address: Address,
    timestamp: Timestamp,
    context: Context,
  ) => Promise<void>;
  writeHash: (address: Address, hash: Hash, context: Context) => Promise<void>;
  readChildIds: (
    address: Address,
    context: Context,
  ) => Promise<string[] | undefined>;
};

export type MetaConnectorOptimizations = {
  getMeta?: () => Promise<Meta>;
};

export function createMetaConnector(
  depth: number,
  implementations: MetaConnectorImplementations,
  optimizations?: MetaConnectorOptimizations,
): Promise<MetaConnector>;

// --

export interface Transport {
  isConnected(): boolean;
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
