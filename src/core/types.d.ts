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

export type MessageType = 0;

export type Message = [
  type: MessageType,
  address: Address,
  node: ProtocolNode,
  context: Context,
];

export type ReceiveMessage = (message: Message, from: string) => Promise<void>;

export interface ProtectedTransport extends Transport {
  _bind(synclet: Synclet, syncletId: string): void;
  _connect(receiveMessage: ReceiveMessage): Promise<void>;
  _disconnect(): Promise<void>;
  _sendMessage(message: Message, to?: string): Promise<void>;
}

export interface ProtectedConnector extends Connector {
  _atomDepth: number;
  _bind(synclet: Synclet, syncletId: string): void;
  _readAtom(address: Address, context: Context): Promise<Atom | undefined>;
  _readTimestamp(
    address: Address,
    context: Context,
  ): Promise<Timestamp | undefined>;
  _readHash(address: Address, context: Context): Promise<Hash | undefined>;
  _readChildIds(
    address: Address,
    context: Context,
  ): Promise<string[] | undefined>;
  _setOrDelAtom(
    address: Address,
    atomOrUndefined: Atom | undefined,
    context: Context,
    syncOrFromSynclet?: boolean | Synclet,
    newTimestamp?: Timestamp,
    oldTimestamp?: Timestamp,
  ): Promise<void>;
}
