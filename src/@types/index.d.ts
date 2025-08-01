/// synclets

export type DeletedValue = '\uFFFC';

export type Timestamp = string;

export type Value = string | number | boolean | null | DeletedValue;

export type Address = string[];

export class Connector {
  getConnected(): boolean;

  connect(): Promise<void>;

  disconnect(): Promise<void>;

  nodeChanged(address: Address): Promise<void>;

  getNode(address: Address): Promise<Value>;

  getNodeTimestamp(address: Address): Promise<Timestamp>;

  setNode(address: Address, value: Value): Promise<void>;

  setNodeTimestamp(address: Address, timestamp: Timestamp): Promise<void>;
}
type BaseConnector = Connector;

export class Transport {
  getConnected(): boolean;

  connect(): Promise<void>;

  disconnect(): Promise<void>;

  send(message: any): Promise<void>;

  receive(message: string): Promise<any>;
}
type BaseTransport = Transport;

export class Synclet<
  Connector extends BaseConnector = BaseConnector,
  Transport extends BaseTransport = BaseTransport,
> {
  constructor(connector: Connector, transport: Transport);

  getConnector(): Connector;

  getTransport(): Transport;

  getStarted(): boolean;

  start(): Promise<void>;

  stop(): Promise<void>;
}
