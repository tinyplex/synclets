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

export const strMatch = (str: string | undefined, regex: RegExp) =>
  str?.match(regex) ?? undefined;

export const strReplaceAll = (str: string, search: string, replace: string) =>
  str.replaceAll(search, replace);

export const strSub = (str: string, start: number, end?: number): string =>
  str.slice(start, end);

export const strEndsWith = (str: string, search: string): boolean =>
  str.endsWith(search);
