import type {
  Atom,
  Hash,
  ProtocolNode,
  ProtocolSubNodes,
  Timestamp,
  TimestampAndAtom,
} from '@synclets/@types';
import {isArray} from './array.ts';
import {isObject, objEvery} from './object.ts';
import {size} from './other.ts';

export const isProtocolNode = (thing: unknown): thing is ProtocolNode =>
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

export const isProtocolSubNodes = (thing: unknown): thing is ProtocolSubNodes =>
  isArray(thing) &&
  isObject(thing[0]) &&
  objEvery(thing[0], isProtocolNode) &&
  (size(thing) == 1 || (size(thing) == 2 && thing[1] === 1));
