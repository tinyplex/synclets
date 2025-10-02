import type {Atom, Timestamp} from '@synclets/@types';

export const isTimestamp = (thing: unknown): thing is Timestamp =>
  typeof thing === 'string';

export const isAtom = (thing: unknown): thing is Atom | undefined =>
  thing === undefined ||
  thing === null ||
  typeof thing === 'number' ||
  typeof thing === 'string' ||
  typeof thing === 'boolean';
