export const GLOBAL = globalThis;

export const promiseAll = <Return>(promises: Promise<Return>[]) =>
  Promise.all(promises);
export const promiseResolve = Promise.resolve;

export const math = Math;
export const mathFloor = math.floor;
export const mathMax = math.max;

export const size = (thing: {length: number}) => thing.length;
export const isEmpty = (thing: {length: number}) => size(thing) == 0;

export const errorNew = (message: string) => {
  throw new Error(message);
};

export const isUndefined = (thing: unknown): thing is undefined =>
  thing === undefined;

export const ifNotUndefined = <Value, Return>(
  value: Value | undefined,
  then: (value: Value) => Return,
  otherwise?: () => Return,
): Return | undefined => (isUndefined(value) ? otherwise?.() : then(value));
