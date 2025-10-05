export const GLOBAL = globalThis;

const promise = Promise;
export const promiseAll = <Return>(promises: Promise<Return>[]) =>
  promise.all(promises);
export const promiseResolve = promise.resolve;
export const promiseNew = <Value>(
  resolver: (
    resolve: (value: Value) => void,
    reject: (reason?: any) => void,
  ) => void,
): Promise<Value> => new promise(resolver);

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

export const slice = <ArrayOrString extends string | any[]>(
  arrayOrString: ArrayOrString,
  start: number,
  end?: number,
): ArrayOrString => arrayOrString.slice(start, end) as ArrayOrString;
