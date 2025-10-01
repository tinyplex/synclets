import type {
  Address,
  Atom,
  Atoms,
  Context,
  Data,
  DataConnector,
  Hash,
  Meta,
  MetaConnector,
  Synclet,
  Timestamp,
  TimestampAndAtom,
  Timestamps,
  Transport,
} from '@synclets/@types';
import {isArray} from '../common/array.ts';
import {isObject, objEvery} from '../common/object.ts';
import {size} from '../common/other.ts';

export type MessageType = 0;

export type Message = [
  version: number,
  type: MessageType,
  depth: number,
  address: Address,
  node: MessageNode,
  context: Context,
];

export type MessageNode = Timestamp | TimestampAndAtom | Hash | MessageSubNodes;

export type MessageSubNodes = [
  subNodes: {[id: string]: MessageNode},
  partial?: 1,
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
    attach: (synclet: ProtectedSynclet) => void,
    detach: () => void,
    connect: (receiveMessage: ReceiveMessage) => Promise<void>,
    disconnect: () => Promise<void>,
    sendMessage: (message: Message, to?: string) => Promise<void>,
  ];
}

export interface ProtectedDataConnector extends DataConnector {
  _: [
    depth: number,
    attach: (synclet: ProtectedSynclet) => Promise<void>,
    detach: () => Promise<void>,
    readAtom: (address: Address, context: Context) => Promise<Atom | undefined>,
    writeAtom: (
      address: Address,
      atom: Atom,
      context: Context,
    ) => Promise<void>,
    removeAtom: (address: Address, context: Context) => Promise<void>,
    readChildIds: (address: Address, context: Context) => Promise<string[]>,
    readAtoms: (address: Address, context: Context) => Promise<Atoms>,
  ];
  $: [getData?: () => Promise<Data>];
}

export interface ProtectedMetaConnector extends MetaConnector {
  _: [
    depth: number,
    attach: (synclet: ProtectedSynclet) => Promise<void>,
    detach: () => Promise<void>,
    readTimestamp: (
      address: Address,
      context: Context,
    ) => Promise<Timestamp | undefined>,
    writeTimestamp: (
      address: Address,
      timestamp: Timestamp,
      context: Context,
    ) => Promise<void>,
    readChildIds: (address: Address, context: Context) => Promise<string[]>,
    readTimestamps: (address: Address, context: Context) => Promise<Timestamps>,
  ];
  $: [getMeta?: () => Promise<Meta>];
}

export const isProtocolNode = (thing: unknown): thing is MessageNode =>
  isTimestamp(thing) ||
  isTimestampAndAtom(thing) ||
  isHash(thing) ||
  isProtocolSubNodes(thing);

export const isTimestamp = (thing: unknown): thing is Timestamp =>
  typeof thing === 'string';

export const isAtom = (thing: unknown): thing is Atom | undefined =>
  thing === undefined ||
  thing === null ||
  typeof thing === 'number' ||
  typeof thing === 'string' ||
  typeof thing === 'boolean';

export const isTimestampAndAtom = (thing: unknown): thing is TimestampAndAtom =>
  isArray(thing) &&
  size(thing) == 2 &&
  isTimestamp(thing[0]) &&
  isAtom(thing[1]);

export const isHash = (thing: unknown): thing is Hash =>
  typeof thing === 'number';

export const isProtocolSubNodes = (thing: unknown): thing is MessageSubNodes =>
  isArray(thing) &&
  isObject(thing[0]) &&
  objEvery(thing[0], isProtocolNode) &&
  (size(thing) == 1 || (size(thing) == 2 && thing[1] === 1));
