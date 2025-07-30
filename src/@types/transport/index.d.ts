/// transport

export class Transport {
  send(data: any): Promise<void>;
  receive(): Promise<any>;
}

export type TransportClass<T extends Transport = Transport> = new () => T;
