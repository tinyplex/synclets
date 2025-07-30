import type {Synclet, Synclet as SyncletDebug} from 'synclets';
import {createSynclet, createSynclet as createSyncletDebug} from 'synclets';

class Connector {
  async connect() {}
  async disconnect() {}
}

class Transport {
  async send() {}
  async receive() {
    return {};
  }
}

const _synchronizer: Synclet = createSynclet(Connector, Transport);
const _synchronizerDebug: SyncletDebug = createSyncletDebug(
  Connector,
  Transport,
);
