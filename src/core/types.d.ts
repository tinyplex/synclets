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
  version: number,
  type: MessageType,
  depth: number,
  address: Address,
  node: ProtocolNode,
  context: Context,
];

export type ReceiveMessage = (message: Message, from: string) => Promise<void>;

export interface ProtectedSynclet extends Synclet {
  _: [
    syncExcept: (
      address: Address,
      transport?: ProtectedTransport,
    ) => Promise<void>,
  ];
}

export interface ProtectedTransport extends Transport {
  _: [
    bind: (synclet: ProtectedSynclet, syncletId: string) => void,
    connect: (receiveMessage: ReceiveMessage) => Promise<void>,
    disconnect: () => Promise<void>,
    sendMessage: (message: Message, to?: string) => Promise<void>,
  ];
}

export interface ProtectedConnector extends Connector {
  _: [
    depth: number,
    bind: (synclet: ProtectedSynclet, syncletId: string) => void,
    readAtom: (address: Address, context: Context) => Promise<Atom | undefined>,
    readTimestamp: (
      address: Address,
      context: Context,
    ) => Promise<Timestamp | undefined>,
    readHash: (address: Address, context: Context) => Promise<Hash | undefined>,
    readChildIds: (
      address: Address,
      context: Context,
    ) => Promise<string[] | undefined>,
    setOrDelAtom: (
      address: Address,
      atomOrUndefined: Atom | undefined,
      context: Context,
      syncOrFromTransport?: boolean | ProtectedTransport,
      newTimestamp?: Timestamp,
      oldTimestamp?: Timestamp,
    ) => Promise<void>,
  ];
}
