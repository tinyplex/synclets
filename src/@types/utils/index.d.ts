/// utils

import {Atom, Hash, Timestamp} from '@synclets/@types';

/// jsonString
export function jsonString(obj: unknown): string;

/// jsonParse
export function jsonParse(str: string): any;

/// getUniqueId
export function getUniqueId(length?: number): string;

/// getHash
export function getHash(string: string): Hash;

/// isTimestamp
export function isTimestamp(thing: unknown): thing is Timestamp;

/// isAtom
export function isAtom(thing: unknown): thing is Atom;

/// getPartsFromPacket
export function getPartsFromPacket(packet: string): [to: string, body: string];

/// getPacketFromParts
export function getPacketFromParts(to: string, body: string): string;
