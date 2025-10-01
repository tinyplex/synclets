/// synclets

import type {Tomb} from './utils/index.d.ts';

export type Atom = string | number | boolean | null | Tomb;

export type Atoms = {[id: string]: Atom};

export type Data = Atoms | {[id: string]: Data};

export type Timestamps = {[id: string]: Timestamp};

export type Meta = Timestamps | {[id: string]: Meta};

export type Timestamp = string;

export type Hash = number;

export type Address = Readonly<string[]>;

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
  destroy(): Promise<void>;
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

export function createSynclet(
  dataConnector: DataConnector,
  metaConnector: MetaConnector,
  transport: Transport | Transport[],
  implementations?: SyncletImplementations,
  options?: SyncletOptions,
): Promise<Synclet>;

// --

export interface DataConnector {
  _brand: 'DataConnector';
  log(message: string, level?: LogLevel): void;
}

export type DataConnectorImplementations = {
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  readAtom: (address: Address, context: Context) => Promise<Atom | undefined>;
  writeAtom: (address: Address, atom: Atom, context: Context) => Promise<void>;
  removeAtom: (address: Address, context: Context) => Promise<void>;
  readChildIds: (address: Address, context: Context) => Promise<string[]>;
  readAtoms: (address: Address, context: Context) => Promise<Atoms>;
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
  _brand: 'MetaConnector';
  log(message: string, level?: LogLevel): void;
}

export type MetaConnectorImplementations = {
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  readTimestamp: (
    address: Address,
    context: Context,
  ) => Promise<Timestamp | undefined>;
  writeTimestamp: (
    address: Address,
    timestamp: Timestamp,
    context: Context,
  ) => Promise<void>;
  readChildIds: (address: Address, context: Context) => Promise<string[]>;
  readTimestamps: (address: Address, context: Context) => Promise<Timestamps>;
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
