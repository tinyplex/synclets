import {
  Hash,
  Node,
  SubNodes,
  Timestamp,
  TimestampAndValue,
  Value,
} from '@synclets/@types';
import {isArray} from './array.ts';
import {isObject, objEvery} from './object.ts';
import {size} from './other.ts';

export const isNode = (node: unknown): node is Node =>
  isTimestamp(node) ||
  isTimestampAndValue(node) ||
  isHash(node) ||
  isSubNodes(node);

export const isTimestamp = (node: unknown): node is Timestamp =>
  typeof node === 'string';

export const isValue = (value: unknown): value is Value =>
  value === null ||
  typeof value === 'number' ||
  typeof value === 'string' ||
  typeof value === 'boolean';

export const isTimestampAndValue = (node: unknown): node is TimestampAndValue =>
  isArray(node) && size(node) == 2 && isTimestamp(node[0]) && isValue(node[1]);

export const isHash = (node: unknown): node is Hash => typeof node === 'number';

export const isSubNodes = (node: unknown): node is SubNodes =>
  isArray(node) &&
  isObject(node[0]) &&
  objEvery(node[0], isNode) &&
  (size(node) == 1 || (size(node) == 2 && node[1] === 1));
