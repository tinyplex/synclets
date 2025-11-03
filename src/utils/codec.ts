import {Hash} from '@synclets/@types';
import {arrayForEach, arrayMap, arrayReduce} from '../common/array.ts';
import {encode} from '../common/codec.ts';
import {GLOBAL, math, mathFloor} from '../common/other.ts';
import {EMPTY_STRING} from '../common/string.ts';

const textEncoder = new GLOBAL.TextEncoder();

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
