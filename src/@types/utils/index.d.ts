/// utils

import {Hash} from '@synclets/@types';

export type GetNow = () => number;

export type Hlc = string;

export function getUniqueId(length?: number): string;

export function getHash(string: string): Hash;

export function getHlcFunctions(
  uniqueId?: string,
  getNow?: GetNow,
): [
  getNextHlc: () => Hlc,
  seenHlc: (remoteHlc: Hlc) => void,
  encodeHlc: (logicalTime: number, counter: number, clientId?: string) => Hlc,
  decodeHlc: (
    hlc: Hlc,
  ) => [logicalTime: number, counter: number, clientId: string],
  getLastLogicalTime: () => number,
  getLastCounter: () => number,
  getClientId: () => string,
];
