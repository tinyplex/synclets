/// synclets

export type DeletedValue = '\uFFFC';

export type Timestamp = string;

export type Value = string | number | boolean | null | DeletedValue;

export type Hash = number;

export type Address = string[];

export type SyncletOptions = {
  id?: string;
  logger?: (message: string) => void;
};

export interface Synclet {
  __brand: 'Synclet';

  getId(): string;

  getStarted(): boolean;

  start(): Promise<void>;

  stop(): Promise<void>;
}

export interface Connector {
  __brand: 'Connector';

  getSyncletId(): string | undefined;
}

export interface Transport {
  __brand: 'Transport';

  getSyncletId(): string | undefined;
}

export function createSynclet(
  connector: Connector,
  transport: Transport,
  options?: SyncletOptions,
): Synclet;

export function createConnector(implementations?: {
  connect?: (change: (address: Address) => Promise<void>) => Promise<void>;
  disconnect?: () => Promise<void>;
  get?: (address: Address) => Promise<Value>;
  getHash?: (address: Address) => Promise<Hash>;
  getTimestamp?: (address: Address) => Promise<Timestamp>;
  set?: (address: Address, value: Value) => Promise<void>;
  setHash?: (address: Address, hash: Hash) => Promise<void>;
  setTimestamp?: (address: Address, timestamp: Timestamp) => Promise<void>;
}): Connector;

export function createTransport(implementations?: {
  connect?: (receivePacket: (string: string) => Promise<void>) => Promise<void>;
  disconnect?: () => Promise<void>;
  sendPacket?: (string: string) => Promise<void>;
  fragmentSize?: number;
}): Transport;
