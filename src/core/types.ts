import type {
  AnyParentAddress,
  Atom,
  AtomAddress,
  Atoms,
  AtomsAddress,
  Data,
  DataConnector,
  Hash,
  Message,
  MessageNode,
  MessageNodes,
  Meta,
  MetaConnector,
  Synclet,
  Timestamp,
  TimestampAddress,
  TimestampAndAtom,
  Timestamps,
  TimestampsAddress,
  Transport,
} from '@synclets/@types';
import {isAtom, isTimestamp} from '@synclets/utils';
import {isArray} from '../common/array.ts';
import {isObject, objEvery} from '../common/object.ts';
import {size} from '../common/other.ts';

export type ReceiveMessage = (message: Message, from: string) => Promise<void>;

export interface ProtectedSynclet<Depth extends number> extends Synclet<Depth> {
  _: [syncChangedAtoms: (...addresses: AtomAddress<Depth>[]) => Promise<void>];
}

export interface ProtectedDataConnector<Depth extends number>
  extends DataConnector<Depth> {
  _: [
    attach: (synclet: ProtectedSynclet<Depth>) => Promise<void>,
    destroy: () => Promise<void>,
    readAtom: (address: AtomAddress<Depth>) => Promise<Atom | undefined>,
    writeAtom: (address: AtomAddress<Depth>, atom: Atom) => Promise<void>,
    removeAtom: (address: AtomAddress<Depth>) => Promise<void>,
    readChildIds: (address: AnyParentAddress<Depth>) => Promise<string[]>,
  ];
  $: [
    readAtoms?: (address: AtomsAddress<Depth>) => Promise<Atoms>,
    getData?: () => Promise<Data>,
  ];
}

export interface ProtectedMetaConnector<Depth extends number>
  extends MetaConnector<Depth> {
  _: [
    attach: (synclet: ProtectedSynclet<Depth>) => Promise<void>,
    detach: () => Promise<void>,
    readTimestamp: (
      address: TimestampAddress<Depth>,
    ) => Promise<Timestamp | undefined>,
    writeTimestamp: (
      address: TimestampAddress<Depth>,
      timestamp: Timestamp,
    ) => Promise<void>,
    readChildIds: (address: AnyParentAddress<Depth>) => Promise<string[]>,
  ];
  $: [
    readTimestamps?: (address: TimestampsAddress<Depth>) => Promise<Timestamps>,
    getMeta?: () => Promise<Meta>,
  ];
}

export interface ProtectedTransport extends Transport {
  _: [
    attach: (synclet: ProtectedSynclet<any>) => void,
    detach: () => Promise<void>,
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

export const isTimestampAndAtom = (thing: unknown): thing is TimestampAndAtom =>
  isArray(thing) &&
  size(thing) == 2 &&
  isTimestamp(thing[0]) &&
  isAtom(thing[1]);

export const isHash = (thing: unknown): thing is Hash =>
  typeof thing === 'number';

export const isProtocolSubNodes = (thing: unknown): thing is MessageNodes =>
  isArray(thing) &&
  isObject(thing[0]) &&
  objEvery(thing[0], isProtocolNode) &&
  (size(thing) == 1 || (size(thing) == 2 && thing[1] === 1));
