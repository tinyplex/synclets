import {isEmpty} from './other.ts';

export const objKeys = Object.keys;

export const objNotEmpty = (obj: Record<string, unknown>): boolean =>
  !isEmpty(objKeys(obj));
