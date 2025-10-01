import {Address} from '@synclets/@types';
import {arrayEvery} from './array.ts';
import {ifNotUndefined, isEmpty, isUndefined} from './other.ts';

type IdObj<Value = unknown> = {[id: string]: Value};

export const object = Object;
const getPrototypeOf = (obj: any) => object.getPrototypeOf(obj);

export const objNew = <Value>(): IdObj<Value> => ({});

export const objEnsure = <Value>(
  obj: IdObj<Value>,
  id: string,
  create: () => Value,
): Value => (isUndefined(obj[id]) ? (obj[id] = create()) : obj[id]);

export const objKeys = (obj: IdObj | undefined): string[] => [
  ...object.keys(obj ?? {}),
];

export const objValues = object.values;

export const objEntries = object.entries;

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

export const objToArray = <Value, Return>(
  obj: {[id: string]: Value},
  cb: (id: string, value: Value) => Return,
): Return[] => objEntries(obj).map(([id, value]) => cb(id, value));

export const objMap = <Value, Return>(
  obj: {[id: string]: Value},
  cb: (value: Value) => Return,
): {[id: string]: Return} =>
  objFromEntries(
    objEntries(obj)
      .map(([id, value]) => [id, cb(value)])
      .filter(([, value]) => !isUndefined(value)),
  );

export const objDeepAction = <Result>(
  obj: IdObj,
  [id, ...next]: Address,
  action: (parent: IdObj, id: string) => Result,
  create = false,
  prune = false,
): Result | undefined =>
  isEmpty(next)
    ? action(obj, id)
    : ifNotUndefined(
        (create ? objEnsure(obj, id, objNew) : obj[id]) as IdObj,
        (child) => {
          const result = objDeepAction(child, next, action, create, prune);
          if (prune && !objNotEmpty(child)) {
            delete obj[id];
          }
          return result;
        },
      );
