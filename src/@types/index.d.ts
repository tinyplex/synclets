/// synclets

export interface Connector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export interface Transport {
  send(data: any): Promise<void>;
  receive(): Promise<any>;
}

export interface Synchronizer {
  start(): void;
  stop(): void;
}

export function createSynchronizer(
  connector: Connector,
  transport: Transport,
): Synchronizer;
