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
  readAtom(address: Address, context: Context): Promise<Atom | undefined>;
  readTimestamp(
    address: Address,
    context: Context,
  ): Promise<Timestamp | undefined>;
  readHash(address: Address, context: Context): Promise<Hash | undefined>;
  isParent(address: Address, context: Context): Promise<boolean | undefined>;
  readChildIds(
    address: Address,
    context: Context,
    includeTombs?: boolean,
  ): Promise<string[] | undefined>;
}

export interface ProtectedTransport extends Transport {
  attachToSynclet(synclet: Synclet): void;
  connect?(receiveMessage: ReceiveMessage): Promise<void>;
  disconnect?(): Promise<void>;
  sendMessage(message: Message, to?: string): Promise<void>;
}
