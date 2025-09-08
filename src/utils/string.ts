import type {Deleted} from '@synclets/@types';

export const EMPTY_STRING = '';
export const ASTERISK = '*';
export const DELETED: Deleted = '\uFFFC';

export const strSplit = (
  str: string,
  separator: string | RegExp = EMPTY_STRING,
  limit?: number,
): string[] => str.split(separator, limit);
