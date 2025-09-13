import {TOMB} from './string.ts';

export const jsonString = (obj: unknown): string =>
  JSON.stringify(obj, (_key, value) => (value === undefined ? TOMB : value));

export const jsonParse = (str: string): any => {
  try {
    return JSON.parse(str, (_key, value) =>
      value === TOMB ? undefined : value,
    );
  } catch {
    return undefined;
  }
};
