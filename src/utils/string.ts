import type {Tomb} from '@synclets/@types';

export const KEY = '\u0000';
export const ATOM_KEY = KEY + 'a';
export const TIMESTAMP_KEY = KEY + 't';
export const HASH_KEY = KEY + 'h';

export const EMPTY_STRING = '';
export const SPACE = ' ';
export const ASTERISK = '*';
export const TOMB: Tomb = '\uFFFC';
export const UTF8 = 'utf8';

export const strSplit = (
  str: string,
  separator: string | RegExp = EMPTY_STRING,
  limit?: number,
): string[] => str.split(separator, limit);
