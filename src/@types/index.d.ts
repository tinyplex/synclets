/// synclets

export type DeletedValue = '\uFFFC';

export type Timestamp = string;

export type Value = string | number | boolean | null | DeletedValue;

export type Hash = number;

export type Address = string[];

export type Node = Timestamp | TimestampAndValue | Hash | SubNodes;

export type TimestampAndValue = [timestamp: Timestamp, value: Value];

export type SubNodes = [subNodes: {[id: string]: Node}, partial?: 1];

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

export interface Connector {
  __brand: 'Connector';
  getSyncletId(): string | undefined;
  getNextTimestamp(): Timestamp;
  log(message: string, level?: LogLevel): void;
}

export interface Transport {
  __brand: 'Transport';
  getSyncletId(): string | undefined;
  log(message: string, level?: LogLevel): void;
}

export type SyncletOptions = {
  id?: string;
  logger?: Logger;
};

export function createSynclet(
  connector: Connector,
  transport: Transport,
  options?: SyncletOptions,
): Synclet;

export type ConnectorOptions = {
  logger?: Logger;
};

export type ConnectorImplementations = {
  connect?: (change: (address: Address) => Promise<void>) => Promise<void>;
  disconnect?: () => Promise<void>;
  get?: (address: Address) => Promise<Value>;
  getHash?: (address: Address) => Promise<Hash>;
  getTimestamp?: (address: Address) => Promise<Timestamp>;
  set?: (address: Address, value: Value) => Promise<void>;
  setHash?: (address: Address, hash: Hash) => Promise<void>;
  setTimestamp?: (address: Address, timestamp: Timestamp) => Promise<void>;
  hasChildren?: (address: Address) => Promise<boolean>;
  getChildren?: (address: Address) => Promise<string[]>;
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

export type TransportOptions = {
  logger?: Logger;
};

export function createTransport(
  implementations?: TransportImplementations,
  options?: TransportOptions,
): Transport;

export function getPartsFromPacket(packet: string): [to: string, body: string];

export function getPacketFromParts(to: string, body: string): string;
