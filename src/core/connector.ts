import type {
  Address,
  Connector as ConnectorDecl,
  Timestamp,
  Value,
} from '@synclets/@types';
import {errorNew} from '@synclets/utils';
import type {ProtectedConnector, ProtectedSynclet} from './protected.d.ts';

export class Connector implements ProtectedConnector<ConnectorDecl> {
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

  async nodeChanged(address: Address): Promise<void> {
    this.#synclet?.sync(address);
  }

  async getNode(_address: Address): Promise<Value> {
    return null;
  }

  async getNodeTimestamp(_address: Address): Promise<Timestamp> {
    return '';
  }

  async setNode(_address: Address, _value: Value): Promise<void> {}

  async setNodeTimestamp(
    _address: Address,
    _timestamp: Timestamp,
  ): Promise<void> {}

  // ---

  attachToSynclet(synclet: ProtectedSynclet): void {
    if (this.#synclet) {
      errorNew('Connector is already attached to a Synclet');
    }
    this.#synclet = synclet;
  }
}
