/// synclets

export type DeletedValue = '\uFFFC';

export type Timestamp = string;

export type Value = string | number | boolean | null | DeletedValue;

export class Connector {
  getConnected(): boolean;

  connect(): Promise<void>;

  disconnect(): Promise<void>;
}
type BaseConnector = Connector;

export class Transport {
  getConnected(): boolean;

  connect(): Promise<void>;

  disconnect(): Promise<void>;

  send(data: any): Promise<void>;

  receive(): Promise<any>;
}
type BaseTransport = Transport;

export class Synclet<
  Connector extends BaseConnector,
  Transport extends BaseTransport,
> {
  constructor(connector: Connector, transport: Transport);

  getConnector(): Connector;

  getTransport(): Transport;

  getStarted(): boolean;

  start(): Promise<void>;

  stop(): Promise<void>;
}
