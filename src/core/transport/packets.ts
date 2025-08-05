import type {
  getPacketFromParts as getPacketFromPartsDecl,
  getPartsFromPacket as getPartsFromPacketDecl,
  LogLevel,
} from '@synclets/@types';
import {
  getUniqueId,
  jsonParse,
  jsonStringify,
  mapEnsure,
  mapNew,
} from '@synclets/utils';
import type {Message, ReceiveMessage} from '../protected.d.ts';

type Pending = [fragments: string[], due: number];

const PACKET = /^(.+) (.+) (\d+) (\d+) (.+)$/;

export const getPacketFunctions = (
  log: (string: string, level?: LogLevel) => void,
  sendPacket?: (packet: string) => Promise<void>,
  fragmentSize: number = 1000,
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
        const allFragments = fragments.join('');
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
    to: string = '*',
  ): Promise<void> => {
    if (sendPacket) {
      const messageId = getUniqueId();
      const allFragments = jsonStringify(message);
      const fragments = allFragments.match(messageSplit) ?? [];
      const total = fragments.length;
      log(
        `send: ${messageId} '${allFragments}', ${total} packets to ${to}`,
        'debug',
      );
      await Promise.all(
        fragments.map((fragment, index) =>
          sendPacket([to, messageId, index, total, fragment].join(' ')),
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
