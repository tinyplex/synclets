/// utils

import {Atom, Timestamp} from '@synclets/@types';

export type Undefined = '\uFFFC';

export const UNDEFINED: Undefined;

export function jsonString(obj: unknown): string;

export function jsonParse(str: string): any;

export function getUniqueId(length?: number): string;

export function isTimestamp(thing: unknown): thing is Timestamp;

export function isAtom(thing: unknown): thing is Atom;
