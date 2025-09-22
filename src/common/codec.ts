import type {Hash} from '@synclets/@types';
import {arrayForEach, arrayMap} from './array.ts';
import {mapGet, mapNew} from './map.ts';
import {GLOBAL} from './other.ts';
import {EMPTY_STRING, strSplit} from './string.ts';

const textEncoder = new GLOBAL.TextEncoder();

const MASK6 = 63;
const ENCODE = strSplit(
  '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz',
);
const DECODE = mapNew(arrayMap(ENCODE, (char, index) => [char, index])) as any;

export const encode = (num: number): string => ENCODE[num & MASK6];

export const decode = (str: string, pos: number): number =>
  mapGet(DECODE, str[pos]) ?? 0;

// fnv1a
export const getHash = (string: string = EMPTY_STRING): Hash => {
  let hash = 0x811c9dc5;
  arrayForEach(textEncoder.encode(string), (char) => {
    hash ^= char;
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  });
  return hash >>> 0;
};

export const combineHash = (hash1?: Hash, hash2?: Hash): Hash =>
  ((hash1 ?? 0) ^ (hash2 ?? 0)) >>> 0;
