import {Hash} from '@synclets/@types';
import {arrayMap} from './array.ts';
import {mapGet, mapNew} from './map.ts';
import {strSplit} from './string.ts';

const MASK6 = 63;
const ENCODE = strSplit(
  '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz',
);
const DECODE = mapNew(arrayMap(ENCODE, (char, index) => [char, index])) as any;

export const encode = (num: number): string => ENCODE[num & MASK6];

export const decode = (str: string, pos: number): number =>
  mapGet(DECODE, str[pos]) ?? 0;

export const combineHash = (hash1?: Hash, hash2?: Hash): Hash =>
  ((hash1 ?? 0) ^ (hash2 ?? 0)) >>> 0;
