import type {ConnectorClass} from './@types/connector/index.d.ts';
import type {Synclet} from './@types/index.d.ts';
import type {TransportClass} from './@types/transport/index.d.ts';

export const createSynclet = (
  _connector: ConnectorClass,
  _transport: TransportClass,
): Synclet => {
  return {
    start: () => {},
    stop: () => {},
  };
};
