import type {Address, Connector, Synclet, Transport} from '@synclets/@types';

export type ProtectedConnector<C extends Connector = Connector> = C & {
  attachToSynclet: (synclet: ProtectedSynclet) => void;
};

export type ProtectedTransport<T extends Transport = Transport> = T & {
  attachToSynclet: (synclet: ProtectedSynclet) => void;
};

export type ProtectedSynclet<
  C extends Connector = Connector,
  T extends Transport = Transport,
> = Synclet<C, T> & {
  sync: (address: Address) => Promise<void>;
  receive(message: string): Promise<void>;
};
