import type {
  Address,
  Atom,
  Connector,
  Context,
  Hash,
  ProtocolNode,
  Synclet,
  Timestamp,
  Transport,
} from '@synclets/@types';
import {MessageType} from './message.ts';

export type Message = [
  type: MessageType,
  address: Address,
  node: ProtocolNode,
  context: Context,
];

export type ReceiveMessage = (message: Message, from: string) => Promise<void>;

export interface ProtectedConnector extends Connector {
  bind(synclet: Synclet, syncletId: string): void;
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
  ): Promise<string[] | undefined>;
  setOrDelAtom(
    address: Address,
    atomOrUndefined: Atom | undefined,
    context: Context,
    syncOrFromSynclet?: boolean | Synclet,
    newTimestamp?: Timestamp,
    oldTimestamp?: Timestamp,
  ): Promise<void>;
}

export interface ProtectedTransport extends Transport {
  bind(synclet: Synclet, syncletId: string): void;
  connect(receiveMessage: ReceiveMessage): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(message: Message, to?: string): Promise<void>;
}
