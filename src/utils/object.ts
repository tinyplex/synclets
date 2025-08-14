import {arrayEvery} from './array.ts';
import {ifNotUndefined, isEmpty, isUndefined} from './other.ts';

export const object = Object;
const getPrototypeOf = (obj: any) => object.getPrototypeOf(obj);

export const objKeys = object.keys;

export const objValues = object.values;

export const objFromEntries = object.fromEntries;

export const isObject = (obj: unknown): obj is {[id: string]: unknown} =>
  !isUndefined(obj) &&
  (ifNotUndefined(
    getPrototypeOf(obj),
    (objPrototype) =>
      objPrototype == object.prototype ||
      isUndefined(getPrototypeOf(objPrototype)),
    /*! istanbul ignore next */
    () => true,
  ) as boolean);

export const objNotEmpty = (obj: {[id: string]: unknown}): boolean =>
  !isEmpty(objKeys(obj));

export const objEvery = <Value>(
  obj: {[id: string]: Value},
  test: (value: Value) => boolean,
): boolean => arrayEvery(objValues(obj), test);
