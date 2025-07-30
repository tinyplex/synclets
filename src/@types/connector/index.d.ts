/// connector

export class Connector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export type ConnectorClass<C extends Connector = Connector> = new () => C;
