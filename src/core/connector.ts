import type {Connector as ConnectorDecl} from '../@types/index.js';

export class Connector implements ConnectorDecl {
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
}
