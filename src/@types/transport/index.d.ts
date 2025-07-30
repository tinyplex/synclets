/// transport

export class BaseTransport {
  send(data: any): Promise<void>;
  receive(): Promise<any>;
}
