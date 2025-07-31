/// transport

export class BaseTransport {
  getConnected(): boolean;

  connect(): Promise<void>;

  disconnect(): Promise<void>;

  send(data: any): Promise<void>;

  receive(): Promise<any>;
}
