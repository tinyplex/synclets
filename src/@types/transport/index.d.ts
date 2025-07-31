/// transport

export class Transport {
  getConnected(): boolean;

  connect(): Promise<void>;

  disconnect(): Promise<void>;

  send(data: any): Promise<void>;

  receive(): Promise<any>;
}
