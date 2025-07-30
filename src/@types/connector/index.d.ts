/// connector

export class BaseConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
