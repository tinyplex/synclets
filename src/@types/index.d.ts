/// synclets

import {MessageType} from '../core/message.ts';

export type DeletedValue = '\uFFFC';

export type Timestamp = string;

export type Value = string | number | boolean | null | DeletedValue;

export type Hash = number;

export type Address = string[];

export type Node = Timestamp | TimestampAndValue | Hash | SubNodes;

export type TimestampAndValue = [timestamp: Timestamp, value: Value];

export type SubNodes = [subNodes: {[id: string]: Node}, partial?: 1];

export type Context = {[key: string]: Value};

export type Logger = {
  error?: (string: string) => void;
  warn?: (string: string) => void;
  info?: (string: string) => void;
  debug?: (string: string) => void;
};
export type LogLevel = keyof Logger;

export interface Synclet {
  __brand: 'Synclet';
  getId(): string;
  getStarted(): boolean;
  getQueueState(): [number, boolean];
  start(): Promise<void>;
  stop(): Promise<void>;
  log(message: string, level?: LogLevel): void;
}

export type SyncletOptions = {
  id?: string;
  logger?: Logger;
};

export type SyncletImplementations = {
  canReceiveMessage?: (
    type: MessageType,
    address: Address,
    node: Node,
    context: Context,
  ) => Promise<boolean>;
  getSendContext?: (
    type: MessageType,
    address: Address,
    node: Node,
    receivedContext?: Context,
  ) => Promise<Context>;
};

export function createSynclet(
  connector: Connector,
  transport: Transport,
  implementations?: SyncletImplementations,
  options?: SyncletOptions,
): Synclet;

export interface Connector {
  __brand: 'Connector';
  getNextTimestamp(): Timestamp;
  log(message: string, level?: LogLevel): void;
}

export type ConnectorOptions = {
  logger?: Logger;
};

export type ConnectorImplementations = {
  connect?: (sync: (address: Address) => Promise<void>) => Promise<void>;
  disconnect?: () => Promise<void>;
  get?: (address: Address, context: Context) => Promise<Value>;
  getHash?: (address: Address, context: Context) => Promise<Hash>;
  getTimestamp?: (address: Address, context: Context) => Promise<Timestamp>;
  set?: (address: Address, value: Value, context: Context) => Promise<void>;
  setHash?: (address: Address, hash: Hash, context: Context) => Promise<void>;
  setTimestamp?: (
    address: Address,
    timestamp: Timestamp,
    context: Context,
  ) => Promise<void>;
  hasChildren?: (address: Address, context: Context) => Promise<boolean>;
  getChildren?: (address: Address, context: Context) => Promise<string[]>;
};

export function createConnector(
  implementations?: ConnectorImplementations,
  options?: ConnectorOptions,
): Connector;

export type TransportImplementations = {
  connect?: (receivePacket: (string: string) => Promise<void>) => Promise<void>;
  disconnect?: () => Promise<void>;
  sendPacket?: (string: string) => Promise<void>;
  fragmentSize?: number;
};

export interface Transport {
  __brand: 'Transport';
  log(message: string, level?: LogLevel): void;
}

export type TransportOptions = {
  logger?: Logger;
};

export function createTransport(
  implementations?: TransportImplementations,
  options?: TransportOptions,
): Transport;

export function getPartsFromPacket(packet: string): [to: string, body: string];

export function getPacketFromParts(to: string, body: string): string;
