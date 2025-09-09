import {setHas, setNew} from './set.ts';
import {EMPTY_STRING} from './string.ts';

export const isArray = Array.isArray;

export const arrayMap = <Value, Return>(
  array: Value[],
  cb: (value: Value, index: number, array: Value[]) => Return,
): Return[] => array.map(cb);

export const arrayReduce = <Value, Result>(
  array: Value[],
  cb: (previous: Result, current: Value) => Result,
  initial: Result,
): Result => array.reduce(cb, initial);

export const arrayForEach = <Value>(
  array: {forEach: (cb: (value: Value, index: number) => void) => void},
  cb: (value: Value, index: number) => void,
): void => array.forEach(cb);

export const arrayPush = <Value>(array: Value[], ...values: Value[]): void => {
  array.push(...values);
};

export const arrayShift = <Value>(array: Value[]): Value | undefined =>
  array.shift();

export const arrayEvery = <Value>(
  array: Value[],
  test: (value: Value, index: number, array: Value[]) => boolean,
): boolean => array.every(test);

export const arrayDifference = (array1: string[], array2: string[]) => {
  const exclude = setNew(array2);
  return array1.filter((value) => !setHas(exclude, value));
};

export const arrayJoin = (
  fragments: (string | number)[],
  separator = EMPTY_STRING,
): string => fragments.join(separator);
