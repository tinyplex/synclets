import type {
  Address,
  Atom,
  Connector,
  Context,
  Hash,
  Node,
  Synclet,
  Timestamp,
  Transport,
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
  connect(sync: (address: Address) => Promise<void>): Promise<void>;
  disconnect(): Promise<void>;
  readAtom(address: Address, context: Context): Promise<Atom | undefined>;
  readTimestamp(address: Address, context: Context): Promise<Timestamp>;
  readHash(address: Address, context: Context): Promise<Hash>;
  hasChildren(address: Address, context: Context): Promise<boolean>;
  readChildrenIds(address: Address, context: Context): Promise<string[]>;
}

export interface ProtectedTransport extends Transport {
  attachToSynclet(synclet: Synclet): void;
  connect(receiveMessage: ReceiveMessage): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(message: Message, to?: string): Promise<void>;
}
