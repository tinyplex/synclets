import type {Transport as TransportDecl} from '@synclets/@types';
import {errorNew} from '@synclets/utils';
import type {ProtectedSynclet, ProtectedTransport} from './protected.d.ts';

export class Transport implements ProtectedTransport<TransportDecl> {
  #connected: boolean = false;
  #synclet: ProtectedSynclet | undefined;

  getConnected(): boolean {
    return this.#connected;
  }

  async connect(): Promise<void> {
    this.#connected = true;
  }

  async disconnect(): Promise<void> {
    this.#connected = false;
  }

  async send(_message: string): Promise<void> {}

  async receive(message: string): Promise<any> {
    await this.#synclet?.receive(message);
  }

  // ---

  attachToSynclet(synclet: ProtectedSynclet) {
    if (this.#synclet) {
      errorNew('Transport is already attached to a Synclet');
    }
    this.#synclet = synclet;
  }
}
