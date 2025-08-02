/// synclets

export type DeletedValue = '\uFFFC';

export type Timestamp = string;

export type Value = string | number | boolean | null | DeletedValue;

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
  getNode?: (address: Address) => Promise<Value>;
  getNodeTimestamp?: (address: Address) => Promise<Timestamp>;
  setNode?: (address: Address, value: Value) => Promise<void>;
  setNodeTimestamp?: (address: Address, timestamp: Timestamp) => Promise<void>;
}): Connector;

export function createTransport(implementations?: {
  connect?: (receivePacket: (string: string) => Promise<void>) => Promise<void>;
  disconnect?: () => Promise<void>;
  sendPacket?: (string: string) => Promise<void>;
}): Transport;
