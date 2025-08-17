import type {
  Address,
  Connector,
  Context,
  Hash,
  Node,
  Synclet,
  Timestamp,
  TimestampAndValue,
  Transport,
  Value,
} from '@synclets/@types';
import {MessageType} from './message.ts';

export type Message = [
  type: MessageType,
  address: Address,
  node: Node,
  context: Context,
];

export type ReceiveMessage = (message: Message, from: string) => Promise<void>;

export interface ProtectedConnector extends Connector {
  attachToSynclet(synclet: Synclet): void;
  connect(change: (address: Address) => Promise<void>): Promise<void>;
  disconnect(): Promise<void>;
  get(address: Address, context: Context): Promise<Value>;
  getHash(address: Address, context: Context): Promise<Hash>;
  getTimestamp(address: Address, context: Context): Promise<Timestamp>;
  set(address: Address, value: Value, context: Context): Promise<void>;
  setHash(address: Address, hash: Hash, context: Context): Promise<void>;
  setTimestamp(
    address: Address,
    timestamp: Timestamp,
    context: Context,
  ): Promise<void>;
  hasChildren(address: Address, context: Context): Promise<boolean>;
  getChildren(address: Address, context: Context): Promise<string[]>;
  getTimestampAndValue(
    address: Address,
    context: Context,
    timestamp?: Timestamp,
  ): Promise<TimestampAndValue>;
  getHashOrTimestamp(
    address: Address,
    context: Context,
  ): Promise<Hash | Timestamp>;
  setTimestampAndValue(
    address: Address,
    timestamp: Timestamp,
    value: Value,
    context: Context,
  ): Promise<void>;
}

export interface ProtectedTransport extends Transport {
  attachToSynclet(synclet: Synclet): void;
  connect(receiveMessage: ReceiveMessage): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(message: Message, to?: string): Promise<void>;
}
