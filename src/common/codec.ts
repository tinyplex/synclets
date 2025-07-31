import {arrayMap, arrayReduce} from './array.ts';
import {GLOBAL, math, mathFloor} from './other.ts';
import {EMPTY_STRING, strSplit} from './string.ts';

const MASK6 = 63;
const ENCODE = /* @__PURE__ */ strSplit(
  '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz',
);

const encode = (num: number): string => ENCODE[num & MASK6];

const getRandomValues = GLOBAL.crypto
  ? (array: Uint8Array): Uint8Array => GLOBAL.crypto.getRandomValues(array)
  : /*! istanbul ignore next */
    (array: Uint8Array): Uint8Array =>
      arrayMap(array as any, () => mathFloor(math.random() * 256)) as any;

export const getUniqueId = (length = 16): string =>
  arrayReduce<number, string>(
    getRandomValues(new Uint8Array(length)) as any,
    (uniqueId, number) => uniqueId + encode(number),
    EMPTY_STRING,
  );
