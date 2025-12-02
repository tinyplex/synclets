import {UNDEFINED} from '@synclets';

export const jsonString = (value: unknown): string =>
  JSON.stringify(value, (_key, value) =>
    value === undefined ? UNDEFINED : value,
  );

export const jsonParse = (string: string): any => {
  try {
    return JSON.parse(string, (_key, value) =>
      value === UNDEFINED ? undefined : value,
    );
  } catch {
    return undefined;
  }
};
