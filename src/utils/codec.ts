import {Hash} from '@synclets/@types';
import {arrayForEach, arrayMap, arrayReduce} from './array.ts';
import {mapGet, mapNew} from './map.ts';
import {GLOBAL, math, mathFloor} from './other.ts';
import {EMPTY_STRING, strSplit} from './string.ts';

const textEncoder = /* @__PURE__ */ new GLOBAL.TextEncoder();

const MASK6 = 63;
const ENCODE = /* @__PURE__ */ strSplit(
  '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz',
);
const DECODE = /* @__PURE__ */ mapNew(
  /* @__PURE__ */ arrayMap(ENCODE, (char, index) => [char, index]),
) as any;

const getRandomValues = GLOBAL.crypto
  ? (array: Uint8Array): Uint8Array => GLOBAL.crypto.getRandomValues(array)
  : /*! istanbul ignore next */
    (array: Uint8Array): Uint8Array =>
      arrayMap(array as any, () => mathFloor(math.random() * 256)) as any;

export const encode = (num: number): string => ENCODE[num & MASK6];

export const decode = (str: string, pos: number): number =>
  mapGet(DECODE, str[pos]) ?? 0;

export const getUniqueId = (length = 16): string =>
  arrayReduce<number, string>(
    getRandomValues(new Uint8Array(length)) as any,
    (uniqueId, number) => uniqueId + encode(number),
    EMPTY_STRING,
  );

// fnv1a
export const getHash = (string: string = ''): Hash => {
  let hash = 0x811c9dc5;
  arrayForEach(textEncoder.encode(string), (char) => {
    hash ^= char;
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  });
  return hash >>> 0;
};
