import {arrayMap, arrayReduce} from '../common/array.ts';
import {encode} from '../common/codec.ts';
import {GLOBAL, math, mathFloor} from '../common/other.ts';
import {EMPTY_STRING} from '../common/string.ts';

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
