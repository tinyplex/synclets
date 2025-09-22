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
  sync(address: Address): Promise<void>;
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
  connector: Connector,
  transport: Transport,
  implementations?: SyncletImplementations,
  options?: SyncletOptions,
): Promise<Synclet>;

// --

export interface Connector {
  log(message: string, level?: LogLevel): void;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  setAtom(
    address: Address,
    atom: Atom,
    context?: Context,
    sync?: boolean,
  ): Promise<void>;
  delAtom(address: Address, context?: Context, sync?: boolean): Promise<void>;
  getData(): Data;
  getMeta(): Meta;
}

export type ConnectorImplementations = {
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  readAtom: (address: Address, context: Context) => Promise<Atom | undefined>;
  readTimestamp: (
    address: Address,
    context: Context,
  ) => Promise<Timestamp | undefined>;
  readHash: (address: Address, context: Context) => Promise<Hash | undefined>;
  writeAtom: (address: Address, atom: Atom, context: Context) => Promise<void>;
  writeTimestamp: (
    address: Address,
    timestamp: Timestamp,
    context: Context,
  ) => Promise<void>;
  writeHash: (address: Address, hash: Hash, context: Context) => Promise<void>;
  removeAtom: (address: Address, context: Context) => Promise<void>;
  readChildIds: (
    address: Address,
    context: Context,
  ) => Promise<string[] | undefined>;
};

export type ConnectorOptions = {
  id?: string;
  logger?: Logger;
};

export function createConnector(
  atomDepth: number,
  implementations: ConnectorImplementations,
  options?: ConnectorOptions,
): Promise<Connector>;

// --

export interface Transport {
  log(message: string, level?: LogLevel): void;
  isConnected(): boolean;
}

export type TransportImplementations = {
  connect?: (receivePacket: (string: string) => Promise<void>) => Promise<void>;
  disconnect?: () => Promise<void>;
  sendPacket: (string: string) => Promise<void>;
};

export type TransportOptions = {
  id?: string;
  logger?: Logger;
  fragmentSize?: number;
};

export function createTransport(
  implementations: TransportImplementations,
  options?: TransportOptions,
): Promise<Transport>;

export function getPartsFromPacket(packet: string): [to: string, body: string];

export function getPacketFromParts(to: string, body: string): string;
