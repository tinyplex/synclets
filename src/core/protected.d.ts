import type {Connector, Synclet, Transport} from '@synclets/@types';

export type ProtectedConnector<C extends Connector = Connector> = C & {
  attachToSynclet: (synclet: Synclet) => void;
};

export type ProtectedTransport<T extends Transport = Transport> = T & {
  attachToSynclet: (synclet: Synclet) => void;
};
