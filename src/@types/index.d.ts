/// synclets

export type DeletedValue = '\uFFFC';

export type Timestamp = string;

export type Value = string | number | boolean | null | DeletedValue;

export class Connector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export type ConnectorClass<C = Connector> = new () => C;

export interface ValueConnector extends Connector {
  isValueConnector: true;
  getValue(): Promise<Value>;
  setValue(value: Value): Promise<void>;

  getValueTimestamp(): Promise<Timestamp>;
  setValueTimestamp(timestamp: Timestamp): Promise<void>;
}

export class Transport {
  send(data: any): Promise<void>;
  receive(): Promise<any>;
}

export type TransportClass<T = Transport> = new () => T;

export interface Synclet {
  start(): void;
  stop(): void;
}

export function createSynclet(
  connector: ConnectorClass,
  transport: TransportClass,
): Synclet;
