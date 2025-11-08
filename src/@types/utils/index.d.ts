/// utils

import {Atom, Hash, Timestamp} from '@synclets/@types';

export function jsonString(obj: unknown): string;

export function jsonParse(str: string): any;

export function getUniqueId(length?: number): string;

export function getHash(string: string): Hash;

export function isTimestamp(thing: unknown): thing is Timestamp;

export function isAtom(thing: unknown): thing is Atom;

export function getPartsFromPacket(packet: string): [to: string, body: string];

export function getPacketFromParts(to: string, body: string): string;
