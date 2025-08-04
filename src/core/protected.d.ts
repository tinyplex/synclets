import type {
  Address,
  Connector,
  Hash,
  Synclet,
  Timestamp,
  Transport,
  Value,
} from '@synclets/@types';
import type {MessageType} from './message.ts';

type Node = Value;

export type Message = {to?: string; from?: string} & (
  | {
      type: MessageType.Have;
      address: Address;
      timestamp: Timestamp;
      hash: Hash;
    }
  | {
      type: MessageType.Give;
      address: Address;
      value: Value;
      timestamp: Timestamp;
      hash: Hash;
    }
);

export type ReceiveMessage = (message: Message) => Promise<void>;

export interface ProtectedConnector extends Connector {
  attachToSynclet(synclet: Synclet): void;
  connect(change: (address: Address) => Promise<void>): Promise<void>;
  disconnect(): Promise<void>;
  get(address: Address): Promise<Node>;
  getHash(address: Address): Promise<Hash>;
  getTimestamp(address: Address): Promise<Timestamp>;
  set(address: Address, value: Node): Promise<void>;
  setHash(address: Address, hash: Hash): Promise<void>;
  setTimestamp(address: Address, timestamp: Timestamp): Promise<void>;
}

export interface ProtectedTransport extends Transport {
  attachToSynclet(synclet: Synclet): void;
  connect(receiveMessage: ReceiveMessage): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(message: Message): Promise<void>;
}
