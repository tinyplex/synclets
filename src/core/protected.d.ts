import type {
  Address,
  Connector,
  Hash,
  Node,
  Synclet,
  Timestamp,
  TimestampAndValue,
  Transport,
  Value,
} from '@synclets/@types';

export type Message = [address: Address, node: Node];

export type ReceiveMessage = (message: Message, from: string) => Promise<void>;

export interface ProtectedConnector extends Connector {
  attachToSynclet(synclet: Synclet): void;
  connect(change: (address: Address) => Promise<void>): Promise<void>;
  disconnect(): Promise<void>;
  get(address: Address): Promise<Value>;
  getHash(address: Address): Promise<Hash>;
  getTimestamp(address: Address): Promise<Timestamp>;
  set(address: Address, value: Value): Promise<void>;
  setHash(address: Address, hash: Hash): Promise<void>;
  setTimestamp(address: Address, timestamp: Timestamp): Promise<void>;
  hasChildren(address: Address): Promise<boolean>;
  getChildren(address: Address): Promise<string[]>;
  getTimestampAndValue(
    address: Address,
    timestamp?: Timestamp,
  ): Promise<TimestampAndValue>;
  getHashOrTimestamp(address: Address): Promise<Hash | Timestamp>;
  setTimestampAndValue(
    address: Address,
    timestamp: Timestamp,
    value: Value,
  ): Promise<void>;
}

export interface ProtectedTransport extends Transport {
  attachToSynclet(synclet: Synclet): void;
  connect(receiveMessage: ReceiveMessage): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(message: Message, to?: string): Promise<void>;
}
