/// synclets

export type DeletedValue = '\uFFFC';

export type Timestamp = string;

export type Value = string | number | boolean | null | DeletedValue;

export type Address = string[];

export interface Synclet {
  __brand: 'Synclet';

  getStarted(): boolean;

  start(): Promise<void>;

  stop(): Promise<void>;
}

export interface Connector {
  __brand: 'Connector';
}

export interface Transport {
  __brand: 'Transport';
}

export function createSynclet(
  connector: Connector,
  transport: Transport,
): Synclet;

export function createConnector(implementations?: {
  connect?: (change: (address: Address) => Promise<void>) => Promise<void>;
  disconnect?: () => Promise<void>;
  getNode?: (address: Address) => Promise<Value>;
  getNodeTimestamp?: (address: Address) => Promise<Timestamp>;
  setNode?: (address: Address, value: Value) => Promise<void>;
  setNodeTimestamp?: (address: Address, timestamp: Timestamp) => Promise<void>;
}): Connector;

export function createTransport(implementations?: {
  connect?: (receive: (message: string) => Promise<void>) => Promise<void>;
  disconnect?: () => Promise<void>;
  send?: (message: string) => Promise<void>;
}): Transport;
