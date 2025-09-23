export const ROOT = '\u0000';
export const ATOM_KEY = ROOT + 'a';
export const TIMESTAMP_KEY = ROOT + 't';
export const HASH_KEY = ROOT + 'h';

export const EMPTY_STRING = '';
export const SPACE = ' ';
export const ASTERISK = '*';
export const UTF8 = 'utf8';

export const INVALID = 'invalid ';
export const INVALID_NODE = INVALID + 'node';
export const WARN = 'warn';

export const strSplit = (
  str: string,
  separator: string | RegExp = EMPTY_STRING,
  limit?: number,
): string[] => str.split(separator, limit);
