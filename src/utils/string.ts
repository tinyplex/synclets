import type {Tomb} from '@synclets/@types';

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
