export const GLOBAL = globalThis;

export const math = Math;
export const mathFloor = math.floor;

export const errorNew = (message: string) => {
  throw new Error(message);
};
