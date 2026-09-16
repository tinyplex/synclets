import type {
  createTransport as createTransportDecl,
  LogLevel,
  Message,
  TransportImplementations,
  TransportOptions,
} from '@synclets/@types';
import {getUniqueId, jsonParse, jsonString} from '@synclets/utils';
import {arrayJoin, arrayMap, arrayPush} from '../common/array.ts';
import {
  mapClear,
  mapDel,
  mapEnsure,
  mapForEach,
  mapGet,
  mapNew,
} from '../common/map.ts';
import {objFreeze} from '../common/object.ts';
import {
  errorNew,
  ifNotUndefined,
  isUndefined,
  promiseAll,
  size,
} from '../common/other.ts';
import {
  ASTERISK,
  EMPTY_STRING,
  INVALID,
  SPACE,
  WARN,
} from '../common/string.ts';
import {ProtectedSynclet, ProtectedTransport} from './types.ts';

type Pending = [
  fragments: string[],
  remaining: number,
  total: number,
  size: number,
  timeout: ReturnType<typeof setTimeout>,
];

const RECEIVE_MESSAGE = 1;
const PACKET = /^(.+) (.+) (\d+) (\d+) (.+)$/;

// A peer cannot be trusted to finish sending what it starts, so partially
// received messages are bounded in count, in size, and in how long they are
// held before being abandoned.
const MAX_FRAGMENT_COUNT = 1000;
const MAX_FRAGMENT_BUFFERS = 100;
const MAX_FRAGMENT_BUFFER_SIZE = 16 * 1024 * 1024;
const FRAGMENT_TIMEOUT = 5000;

export const createTransport: typeof createTransportDecl = (
  {
    attach: attachImpl,
    detach: detachImpl,
    sendPacket,
  }: TransportImplementations,
  options: TransportOptions = {},
  extraMembers = {},
): ProtectedTransport => {
  let attachedSynclet: ProtectedSynclet<number> | undefined;

  const fragmentSize = options.fragmentSize ?? 4096;

  const getUtf8Size = (codePoint: number) =>
    codePoint <= 0x7f
      ? 1
      : codePoint <= 0x7ff
        ? 2
        : codePoint <= 0xffff
          ? 3
          : 4;

  // Each fragment is encoded and transmitted on its own, so a fragment may only
  // end on a code point boundary: half of a surrogate pair would be corrupted.
  const getFragments = (string: string): string[] => {
    const fragments: string[] = [];
    let fragment = EMPTY_STRING;
    let fragmentSizeSoFar = 0;
    for (const character of string) {
      const characterSize = getUtf8Size(character.codePointAt(0)!);
      if (
        fragmentSizeSoFar &&
        fragmentSizeSoFar + characterSize > fragmentSize
      ) {
        arrayPush(fragments, fragment);
        fragment = EMPTY_STRING;
        fragmentSizeSoFar = 0;
      }
      fragment += character;
      fragmentSizeSoFar += characterSize;
    }
    if (fragmentSizeSoFar) {
      arrayPush(fragments, fragment);
    }
    return fragments;
  };

  const buffer: Map<string, Pending> = mapNew();
  let bufferSize = 0;

  const delPending = (bufferId: string) =>
    ifNotUndefined(mapGet(buffer, bufferId), (pending) => {
      clearTimeout(pending[4]);
      bufferSize -= pending[3];
      mapDel(buffer, bufferId);
    });

  const clearBuffer = () => {
    mapForEach(buffer, (_, pending) => clearTimeout(pending[4]));
    mapClear(buffer);
    bufferSize = 0;
  };

  const receivePacket = async (packet: string) => {
    const [, from, messageId, indexStr, totalStr, fragment] =
      packet.match(PACKET) ?? [];
    if (messageId) {
      const index = parseInt(indexStr);
      const total = parseInt(totalStr);
      const bufferId = from + SPACE + messageId;
      const packetSize = size(fragment);
      const existing = mapGet(buffer, bufferId);

      if (total < 1 || total > MAX_FRAGMENT_COUNT || index >= total) {
        return log(`${INVALID}fragment ${index}/${total} from ${from}`, WARN);
      }
      if (!isUndefined(existing) && existing[2] != total) {
        delPending(bufferId);
        return log(`${INVALID}fragment total ${total} from ${from}`, WARN);
      }
      if (
        (isUndefined(existing) && buffer.size >= MAX_FRAGMENT_BUFFERS) ||
        bufferSize + packetSize > MAX_FRAGMENT_BUFFER_SIZE
      ) {
        return log(`${INVALID}fragment buffer overflow from ${from}`, WARN);
      }

      const pending = mapEnsure(
        buffer,
        bufferId,
        (): Pending => [
          [],
          total,
          total,
          0,
          setTimeout(() => delPending(bufferId), FRAGMENT_TIMEOUT),
        ],
      );
      const [fragments] = pending;

      if (isUndefined(fragments[index])) {
        fragments[index] = fragment;
        pending[1]--;
        pending[3] += packetSize;
        bufferSize += packetSize;
      }

      if (pending[1] === 0) {
        const allFragments = arrayJoin(fragments);
        delPending(bufferId);
        log(
          `recv: ${messageId} '${allFragments}', ${total} packets from ${from}`,
          'debug',
        );
        await attachedSynclet?._[RECEIVE_MESSAGE]?.(
          transport,
          jsonParse(allFragments),
          from,
        );
      }
    }
  };

  // --

  const log = (message: string, level?: LogLevel) =>
    attachedSynclet?.log(message, level);

  const attach = async (synclet: ProtectedSynclet<number>) => {
    if (attachedSynclet) {
      errorNew('Transport is already attached to Synclet');
    }
    attachedSynclet = synclet;
    clearBuffer();
    await attachImpl?.(receivePacket);
  };

  const detach = async () => {
    await detachImpl?.();
    clearBuffer();
    attachedSynclet = undefined;
  };

  const sendMessage = async (
    message: Message,
    to: string = ASTERISK,
  ): Promise<void> => {
    if (sendPacket) {
      const messageId = getUniqueId();
      const allFragments = jsonString(message);
      const fragments = getFragments(allFragments);
      const total = size(fragments);
      log(
        `send: ${messageId} '${allFragments}', ${total} packets to ${to}`,
        'debug',
      );
      await promiseAll(
        arrayMap(fragments, (fragment, index) =>
          sendPacket(arrayJoin([to, messageId, index, total, fragment], SPACE)),
        ),
      );
    }
  };

  const transport = objFreeze({
    _brand: 'Transport',
    log,
    _: [attach, detach, sendMessage],
    ...extraMembers,
  }) as ProtectedTransport;
  return transport;
};
