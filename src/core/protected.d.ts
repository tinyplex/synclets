import type {
  Address,
  Connector,
  Synclet,
  Timestamp,
  Transport,
  Value,
} from '@synclets/@types';

export interface ProtectedConnector extends Connector {
  attachToSynclet: (synclet: ProtectedSynclet) => void;
  connect(change: (address: Address) => Promise<void>): Promise<void>;
  disconnect(): Promise<void>;
  getConnected(): boolean;
  getNode(address: Address): Promise<Value>;
  getNodeTimestamp(address: Address): Promise<Timestamp>;
  setNode(address: Address, value: Value): Promise<void>;
  setNodeTimestamp(address: Address, timestamp: Timestamp): Promise<void>;
}

export interface ProtectedTransport extends Transport {
  attachToSynclet: (synclet: ProtectedSynclet) => void;
  connect: (receive: (message: string) => Promise<void>) => Promise<void>;
  disconnect: () => Promise<void>;
  getConnected: () => boolean;
  send: (message: string) => Promise<void>;
}

export interface ProtectedSynclet extends Synclet {
  changed: (address: Address) => Promise<void>;
  receive(message: string): Promise<void>;
}
