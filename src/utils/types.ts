import {
  Atom,
  Hash,
  Node,
  SubNodes,
  Timestamp,
  TimestampAndAtom,
} from '@synclets/@types';
import {isArray} from './array.ts';
import {isObject, objEvery} from './object.ts';
import {size} from './other.ts';

export const isNode = (node: unknown): node is Node =>
  isTimestamp(node) ||
  isTimestampAndAtom(node) ||
  isHash(node) ||
  isSubNodes(node);

export const isTimestamp = (node: unknown): node is Timestamp =>
  typeof node === 'string';

export const isAtom = (value: unknown): value is Atom | undefined =>
  value === undefined ||
  value === null ||
  typeof value === 'number' ||
  typeof value === 'string' ||
  typeof value === 'boolean';

export const isTimestampAndAtom = (node: unknown): node is TimestampAndAtom =>
  isArray(node) && size(node) == 2 && isTimestamp(node[0]) && isAtom(node[1]);

export const isHash = (node: unknown): node is Hash => typeof node === 'number';

export const isSubNodes = (node: unknown): node is SubNodes =>
  isArray(node) &&
  isObject(node[0]) &&
  objEvery(node[0], isNode) &&
  (size(node) == 1 || (size(node) == 2 && node[1] === 1));
