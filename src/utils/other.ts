export const GLOBAL = globalThis;

export const math = Math;
export const mathFloor = math.floor;
export const mathMax = math.max;

export const errorNew = (message: string) => {
  throw new Error(message);
};

export const jsonParse = (string: string): any | null => {
  try {
    return JSON.parse(string);
  } catch {
    return null;
  }
};

export const jsonStringify = (value: any): string => JSON.stringify(value);
