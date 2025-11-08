import {UNDEFINED} from '@synclets';

export const jsonString = (obj: unknown): string =>
  JSON.stringify(obj, (_key, value) =>
    value === undefined ? UNDEFINED : value,
  );

export const jsonParse = (str: string): any => {
  try {
    return JSON.parse(str, (_key, value) =>
      value === UNDEFINED ? undefined : value,
    );
  } catch {
    return undefined;
  }
};
