import type {
  Address,
  Connector,
  Synclet,
  Timestamp,
  Transport,
  Value,
} from '@synclets/@types';

export interface Message {
  toId?: string;
  address: Address;
  node: Value;
}

export type ReceiveMessage = (message: Message) => Promise<void>;

export interface ProtectedConnector extends Connector {
  attachToSynclet(synclet: ProtectedSynclet): void;
  connect(change: (address: Address) => Promise<void>): Promise<void>;
  disconnect(): Promise<void>;
  getNode(address: Address): Promise<Value>;
  getNodeTimestamp(address: Address): Promise<Timestamp>;
  setNode(address: Address, value: Value): Promise<void>;
  setNodeTimestamp(address: Address, timestamp: Timestamp): Promise<void>;
}

export interface ProtectedTransport extends Transport {
  attachToSynclet(synclet: ProtectedSynclet): void;
  connect(receiveMessage: ReceiveMessage): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(message: Message): Promise<void>;
}

export interface ProtectedSynclet extends Synclet {
  log(message: string): void;
  sync(address: Address): Promise<void>;
}
