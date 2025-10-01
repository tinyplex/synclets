import type {
  Address,
  AncestorAddressFor,
  AnyAddressFor,
  Atom,
  Atoms,
  Context,
  Data,
  DataConnector,
  Hash,
  LeafAddressFor,
  Meta,
  MetaConnector,
  ParentAddressFor,
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

export interface ProtectedSynclet<
  Depth extends number,
  AnyAddress = AnyAddressFor<Depth>,
> extends Synclet<Depth> {
  _: [
    syncExcept: (
      address: AnyAddress,
      transport?: ProtectedTransport,
    ) => Promise<void>,
  ];
}

export interface ProtectedDataConnector<
  Depth extends number,
  AtomAddress = LeafAddressFor<Depth>,
  ParentAddress = ParentAddressFor<Depth>,
  AncestorAddress = AncestorAddressFor<Depth>,
> extends DataConnector<Depth> {
  _: [
    attach: (synclet: ProtectedSynclet<Depth>) => Promise<void>,
    detach: () => Promise<void>,
    readAtom: (
      address: AtomAddress,
      context: Context,
    ) => Promise<Atom | undefined>,
    writeAtom: (
      address: AtomAddress,
      atom: Atom,
      context: Context,
    ) => Promise<void>,
    removeAtom: (address: AtomAddress, context: Context) => Promise<void>,
    readChildIds: (
      address: AncestorAddress,
      context: Context,
    ) => Promise<string[]>,
    readAtoms: (address: ParentAddress, context: Context) => Promise<Atoms>,
  ];
  $: [getData?: () => Promise<Data>];
}

export interface ProtectedMetaConnector<
  Depth extends number,
  TimestampAddress = LeafAddressFor<Depth>,
  ParentAddress = ParentAddressFor<Depth>,
  AncestorAddress = AncestorAddressFor<Depth>,
> extends MetaConnector<Depth> {
  _: [
    attach: (synclet: ProtectedSynclet<Depth>) => Promise<void>,
    detach: () => Promise<void>,
    readTimestamp: (
      address: TimestampAddress,
      context: Context,
    ) => Promise<Timestamp | undefined>,
    writeTimestamp: (
      address: TimestampAddress,
      timestamp: Timestamp,
      context: Context,
    ) => Promise<void>,
    readChildIds: (
      address: AncestorAddress,
      context: Context,
    ) => Promise<string[]>,
    readTimestamps: (
      address: ParentAddress,
      context: Context,
    ) => Promise<Timestamps>,
  ];
  $: [getMeta?: () => Promise<Meta>];
}

export interface ProtectedTransport extends Transport {
  _: [
    attach: (synclet: ProtectedSynclet<number>) => void,
    detach: () => void,
    connect: (receiveMessage: ReceiveMessage) => Promise<void>,
    disconnect: () => Promise<void>,
    sendMessage: (message: Message, to?: string) => Promise<void>,
  ];
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
