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
  getAtom(address: Address, context: Context): Promise<Atom | undefined>;
  getHash(address: Address, context: Context): Promise<Hash>;
  getTimestamp(address: Address, context: Context): Promise<Timestamp>;
  setManagedAtom(
    address: Address,
    atom: Atom,
    context: Context,
    newTimestamp: Timestamp,
    oldTimestamp?: Timestamp,
  ): Promise<void>;
  hasChildren(address: Address, context: Context): Promise<boolean>;
  getChildren(address: Address, context: Context): Promise<string[]>;
}

export interface ProtectedTransport extends Transport {
  attachToSynclet(synclet: Synclet): void;
  connect(receiveMessage: ReceiveMessage): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(message: Message, to?: string): Promise<void>;
}
