import type {
  Connector,
  Synchronizer,
  Synchronizer as SynchronizerDebug,
  Transport,
} from 'synclets';
import {
  createSynchronizer,
  createSynchronizer as createSynchronizerDebug,
} from 'synclets';

const connector: Connector = {
  connect: async () => {},
  disconnect: async () => {},
};

const transport: Transport = {
  send: async () => {},
  receive: async () => ({}),
};

const _synchronizer: Synchronizer = createSynchronizer(connector, transport);
const _synchronizerDebug: SynchronizerDebug = createSynchronizerDebug(
  connector,
  transport,
);
