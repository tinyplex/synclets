import type {Transport as TransportDecl} from '../@types/transport/index.d.ts';

export class Transport implements TransportDecl {
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
