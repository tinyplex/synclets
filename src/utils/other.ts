export const GLOBAL = globalThis;

export const promiseAll = (promises: Promise<any>[]) => Promise.all(promises);
export const promiseResolve = Promise.resolve;

export const math = Math;
export const mathFloor = math.floor;
export const mathMax = math.max;

export const errorNew = (message: string) => {
  throw new Error(message);
};

export const jsonParse = (string: string): any | null => {
  try {
    return JSON.parse(string);
  } catch {
    return null;
  }
};

export const jsonStringify = (value: any): string => JSON.stringify(value);

export const isUndefined = (thing: unknown): thing is undefined | null =>
  thing == undefined;

export const ifNotUndefined = <Value, Return>(
  value: Value | null | undefined,
  then: (value: Value) => Return,
  otherwise?: () => Return,
): Return | undefined => (isUndefined(value) ? otherwise?.() : then(value));
