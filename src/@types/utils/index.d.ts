/// utils

import {Atom, Hash, Timestamp} from '@synclets/@types';

/// jsonString
export function jsonString(value: unknown): string;

/// jsonParse
export function jsonParse(string: string): any;

/// getUniqueId
export function getUniqueId(length?: number): string;

/// getHash
export function getHash(string: string): Hash;

/// isTimestamp
export function isTimestamp(thing: unknown): thing is Timestamp;

/// isAtom
export function isAtom(thing: unknown): thing is Atom;

/// getPartsFromPacket
export function getPartsFromPacket(
  packet: string,
): [toOrFrom: string, body: string];

/// getPacketFromParts
export function getPacketFromParts(toOrFrom: string, body: string): string;
