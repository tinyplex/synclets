import {
  Hash,
  Node,
  Timestamp,
  TimestampAndValue,
  Value,
} from '@synclets/@types';
import {isObject, objEvery} from './object.ts';
import {size} from './other.ts';

export const isNode = (node: any): node is Node =>
  isTimestamp(node) ||
  isTimestampAndValue(node) ||
  isHash(node) ||
  isSubNodes(node);

export const isTimestamp = (node: Node): node is Timestamp =>
  typeof node === 'string';

export const isValue = (value: Value): value is Value =>
  value === null ||
  typeof value === 'number' ||
  typeof value === 'string' ||
  typeof value === 'boolean';

export const isTimestampAndValue = (node: Node): node is TimestampAndValue =>
  Array.isArray(node) &&
  size(node) == 2 &&
  isTimestamp(node[0]) &&
  isValue(node[1]);

export const isHash = (node: Node): node is Hash => typeof node === 'number';

export const isSubNodes = (node: Node): node is {[id: string]: Node} =>
  isObject(node) && objEvery(node, isNode);
