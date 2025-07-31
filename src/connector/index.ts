import type {BaseConnector as BaseConnectorDecl} from '../@types/connector/index.d.ts';

export class BaseConnector implements BaseConnectorDecl {
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
