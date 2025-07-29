import type {
  Connector,
  Synchronizer,
  Transport,
  createSynchronizer as createSynchronizerDecl,
} from './@types/index.js';

export const createSynchronizer: typeof createSynchronizerDecl = (
  _connector: Connector,
  _transport: Transport,
): Synchronizer => {
  return {
    start: () => {},
    stop: () => {},
  };
};
