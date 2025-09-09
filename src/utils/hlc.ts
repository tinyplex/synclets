import type {
  GetNow,
  Hlc,
  getHlcFunctions as getHlcFunctionsDecl,
} from '@synclets/@types/utils';
import {decode, encode, getHash, getUniqueId} from './codec.ts';
import {ifNotUndefined, isUndefined, mathMax} from './other.ts';
import {EMPTY_STRING} from './string.ts';

const SHIFT36 = 2 ** 36;
const SHIFT30 = 2 ** 30;
const SHIFT24 = 2 ** 24;
const SHIFT18 = 2 ** 18;
const SHIFT12 = 2 ** 12;
const SHIFT6 = 2 ** 6;

const getClientIdFromUniqueId = (uniqueId: string): string => {
  const clientHash30 = getHash(uniqueId);
  return (
    encode(clientHash30 / SHIFT24) +
    encode(clientHash30 / SHIFT18) +
    encode(clientHash30 / SHIFT12) +
    encode(clientHash30 / SHIFT6) +
    encode(clientHash30)
  );
};

export const getHlcFunctions: typeof getHlcFunctionsDecl = (
  uniqueId?: string,
  getNow: GetNow = Date.now,
): [
  getNextHlc: () => Hlc,
  seenHlc: (remoteHlc: Hlc) => void,
  setUniqueId: (uniqueId: string) => void,
  encodeHlc: (logicalTime: number, counter: number, clientId?: string) => Hlc,
  decodeHlc: (
    hlc: Hlc,
  ) => [logicalTime: number, counter: number, clientId: string],
  getLastLogicalTime: () => number,
  getLastCounter: () => number,
  getClientId: () => string,
] => {
  let lastLogicalTime = 0;
  let lastCounter = -1;

  let thisClientId = ifNotUndefined(uniqueId, getClientIdFromUniqueId, () =>
    getUniqueId(5),
  ) as string;

  const getNextHlc = (): Hlc => {
    seenHlc();
    return encodeHlc(lastLogicalTime, ++lastCounter);
  };

  const seenHlc = (hlc?: Hlc): void => {
    const previousLogicalTime = lastLogicalTime;
    const [remoteLogicalTime, remoteCounter] =
      isUndefined(hlc) || hlc == EMPTY_STRING ? [0, 0] : decodeHlc(hlc);
    lastLogicalTime = mathMax(previousLogicalTime, remoteLogicalTime, getNow());
    lastCounter =
      lastLogicalTime == previousLogicalTime
        ? lastLogicalTime == remoteLogicalTime
          ? mathMax(lastCounter, remoteCounter)
          : lastCounter
        : lastLogicalTime == remoteLogicalTime
          ? remoteCounter
          : -1;
  };

  const setUniqueId = (uniqueId: string) => {
    thisClientId = getClientIdFromUniqueId(uniqueId);
  };

  const encodeHlc = (
    logicalTime42: number,
    counter24: number,
    uniqueId?: string,
  ) =>
    encode(logicalTime42 / SHIFT36) +
    encode(logicalTime42 / SHIFT30) +
    encode(logicalTime42 / SHIFT24) +
    encode(logicalTime42 / SHIFT18) +
    encode(logicalTime42 / SHIFT12) +
    encode(logicalTime42 / SHIFT6) +
    encode(logicalTime42) +
    encode(counter24 / SHIFT18) +
    encode(counter24 / SHIFT12) +
    encode(counter24 / SHIFT6) +
    encode(counter24) +
    (isUndefined(uniqueId) ? thisClientId : getClientIdFromUniqueId(uniqueId));

  const decodeHlc = (
    hlc16: Hlc,
  ): [logicalTime42: number, counter24: number, clientId: string] => [
    decode(hlc16, 0) * SHIFT36 +
      decode(hlc16, 1) * SHIFT30 +
      decode(hlc16, 2) * SHIFT24 +
      decode(hlc16, 3) * SHIFT18 +
      decode(hlc16, 4) * SHIFT12 +
      decode(hlc16, 5) * SHIFT6 +
      decode(hlc16, 6),
    decode(hlc16, 7) * SHIFT18 +
      decode(hlc16, 8) * SHIFT12 +
      decode(hlc16, 9) * SHIFT6 +
      decode(hlc16, 10),
    hlc16.slice(11) as string,
  ];

  const getLastLogicalTime = (): number => lastLogicalTime;

  const getLastCounter = (): number => lastCounter;

  const getClientId = (): string => thisClientId;

  return [
    getNextHlc,
    seenHlc,
    setUniqueId,
    encodeHlc,
    decodeHlc,
    getLastLogicalTime,
    getLastCounter,
    getClientId,
  ];
};
