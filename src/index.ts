import type {
  ConnectorClass,
  Synclet,
  TransportClass,
} from './@types/index.d.ts';
// import {Connector} from './connectors/Connector.ts';

import {ValueConnector} from './connector/ValueConnector.ts';
import {MemoryTransport} from './transport/MemoryTransport.ts';

export const createSynclet = (
  _connector: ConnectorClass,
  _transport: TransportClass,
): Synclet => {
  return {
    start: () => {},
    stop: () => {},
  };
};

createSynclet(ValueConnector, MemoryTransport);
