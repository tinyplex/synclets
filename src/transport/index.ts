import type {BaseTransport as BaseTransportDecl} from '../@types/transport/index.d.ts';

export class BaseTransport implements BaseTransportDecl {
  private connected: boolean = false;

  getConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async send(): Promise<void> {}

  async receive(): Promise<any> {}
}
