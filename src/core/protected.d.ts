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

export type Message =
  | [type: MessageType.Timestamp, address: Address, timestamp: Timestamp]
  | [
      type: MessageType.TimestampAndValue,
      address: Address,
      timestamp: Timestamp,
      value: Value,
    ]
  | [type: MessageType.Hash, address: Address, hash: Hash]
  | [
      type: MessageType.Timestamps,
      address: Address,
      timestamps: {[id: string]: Timestamp},
    ]
  | [
      type: MessageType.TimestampsAndValues,
      address: Address,
      timestampsAndValues: {[id: string]: [timestamp: Timestamp, value: Value]},
      needIds: string[],
    ];

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
  getChildren(address: Address): Promise<string[]>;
}

export interface ProtectedTransport extends Transport {
  attachToSynclet(synclet: Synclet): void;
  connect(receiveMessage: ReceiveMessage): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(message: Message, to?: string): Promise<void>;
}
