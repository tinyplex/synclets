import type {Synclet, Transport as TransportDecl} from '../@types/index.d.ts';
import {errorNew} from '../common/index.ts';
import type {ProtectedTransport} from './protected.d.ts';

export class Transport implements ProtectedTransport<TransportDecl> {
  #connected: boolean = false;
  #synclet: Synclet | undefined;

  getConnected(): boolean {
    return this.#connected;
  }

  async connect(): Promise<void> {
    this.#connected = true;
  }

  async disconnect(): Promise<void> {
    this.#connected = false;
  }

  async send(): Promise<void> {}

  async receive(): Promise<any> {}

  // ---

  attachToSynclet(synclet: Synclet) {
    if (this.#synclet) {
      errorNew('Transport is already attached to a Synclet');
    }
    this.#synclet = synclet;
  }
}
