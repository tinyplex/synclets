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

type NodeValue = Value;

type HaveNodes = Hash | [Hash, {[id: string]: HaveNodes}];
type GiveNodes = [Hash, {[id: string]: [Timestamp, Value] | GiveNodes}];

export type Message =
  | [type: MessageType.HaveNode, timestamp: Timestamp]
  | [type: MessageType.GiveNode, timestamp: Timestamp, value: Value];

export type ReceiveMessage = (message: Message, from: string) => Promise<void>;

export interface ProtectedConnector extends Connector {
  attachToSynclet(synclet: Synclet): void;
  connect(change: (address: Address) => Promise<void>): Promise<void>;
  disconnect(): Promise<void>;
  get(address: Address): Promise<NodeValue>;
  getHash(address: Address): Promise<Hash>;
  getTimestamp(address: Address): Promise<Timestamp>;
  set(address: Address, value: NodeValue): Promise<void>;
  setHash(address: Address, hash: Hash): Promise<void>;
  setTimestamp(address: Address, timestamp: Timestamp): Promise<void>;
  hasChildren(address: Address): Promise<boolean>;
}

export interface ProtectedTransport extends Transport {
  attachToSynclet(synclet: Synclet): void;
  connect(receiveMessage: ReceiveMessage): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(message: Message, to?: string): Promise<void>;
}
