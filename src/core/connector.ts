import type {Connector as ConnectorDecl, Synclet} from '../@types/index.js';
import {errorNew} from '../common/index.ts';
import type {ProtectedConnector} from './protected.d.ts';

export class Connector implements ProtectedConnector<ConnectorDecl> {
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

  // ---

  attachToSynclet(synclet: Synclet) {
    if (this.#synclet) {
      errorNew('Connector is already attached to a Synclet');
    }
    this.#synclet = synclet;
  }
}
