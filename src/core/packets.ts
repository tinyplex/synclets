import type {
  getPacketFromParts as getPacketFromPartsDecl,
  getPartsFromPacket as getPartsFromPacketDecl,
  LogLevel,
} from '@synclets/@types';
import {getUniqueId, jsonParse, jsonString} from '@synclets/utils';
import {arrayJoin, arrayMap} from '../common/array.ts';
import {mapEnsure, mapNew} from '../common/map.ts';
import {promiseAll, size} from '../common/other.ts';
import {ASTERISK, SPACE} from '../common/string.ts';
import type {Message, ReceiveMessage} from './protected.js';

type Pending = [fragments: string[], due: number];

const PACKET = /^(.+) (.+) (\d+) (\d+) (.+)$/;

export const getPacketFunctions = (
  log: (string: string, level?: LogLevel) => void,
  sendPacket: (packet: string) => Promise<void>,
  fragmentSize: number,
): [
  startBuffer: (receiveMessage: ReceiveMessage) => Promise<void>,
  stopBuffer: () => void,
  receivePacket: (packet: string) => Promise<void>,
  sendPackets: (message: Message, to?: string) => Promise<void>,
] => {
  let receiveFinalMessage: ReceiveMessage | undefined;

  const messageSplit = new RegExp(`(.{1,${fragmentSize}})`, 'g');

  const buffer: Map<string, Pending> = mapNew();

  const startBuffer = async (receiveMessage: ReceiveMessage) => {
    buffer.clear();
    receiveFinalMessage = receiveMessage;
  };

  const stopBuffer = () => buffer.clear();

  const receivePacket = async (packet: string) => {
    const [, from, messageId, indexStr, totalStr, fragment] =
      packet.match(PACKET) ?? [];
    if (messageId) {
      const index = parseInt(indexStr);
      const total = parseInt(totalStr);

      const pending = mapEnsure(
        buffer,
        from + ' ' + messageId,
        (): Pending => [[], total],
      );
      const [fragments] = pending;

      if (fragments[index] == null) {
        fragments[index] = fragment;
        pending[1]--;
      }

      if (pending[1] === 0) {
        buffer.delete(messageId);
        const allFragments = arrayJoin(fragments);
        log(
          `recv: ${messageId} '${allFragments}', ${total} packets from ${from}`,
          'debug',
        );
        await receiveFinalMessage?.(jsonParse(allFragments), from);
      }
    }
  };

  const sendPackets = async (
    message: Message,
    to: string = ASTERISK,
  ): Promise<void> => {
    if (sendPacket) {
      const messageId = getUniqueId();
      const allFragments = jsonString(message);
      const fragments = allFragments.match(messageSplit) ?? [];
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

  return [startBuffer, stopBuffer, receivePacket, sendPackets];
};

export const getPartsFromPacket: typeof getPartsFromPacketDecl = (
  packet: string,
): [to: string, body: string] =>
  (packet.match(/^(.+?) (.+)/) ?? []).slice(1, 3) as [string, string];

export const getPacketFromParts: typeof getPacketFromPartsDecl = (
  to: string,
  body: string,
): string => `${to} ${body}`;
