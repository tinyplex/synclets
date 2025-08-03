import {
  getUniqueId,
  jsonParse,
  jsonStringify,
  mapEnsure,
  mapNew,
  mathMax,
} from '@synclets/utils';
import type {Message, ReceiveMessage} from '../protected.d.ts';

type Pending = [fragments: string[], due: number];

const PACKET = /^(.+) (\d+) (\d+) (.+)$/;
const HEADER_SIZE = 32;

export const getPacketFunctions = (
  sendPacket?: (packet: string) => Promise<void>,
  maxPacketSize: number = 50,
): [
  startBuffer: (receiveMessage: ReceiveMessage) => Promise<void>,
  stopBuffer: () => void,
  receivePacket: (packet: string) => Promise<void>,
  sendPackets: (message: Message) => Promise<void>,
] => {
  let receiveFinalMessage: ReceiveMessage | undefined;

  const messageSplit = new RegExp(
    `(.{1,${mathMax(maxPacketSize - HEADER_SIZE, HEADER_SIZE)}})`,
    'g',
  );

  const buffer: Map<string, Pending> = mapNew();

  const startBuffer = async (receiveMessage: ReceiveMessage) => {
    buffer.clear();
    receiveFinalMessage = receiveMessage;
  };

  const stopBuffer = () => buffer.clear();

  const receivePacket = async (packet: string) => {
    const [, messageId, indexStr, totalStr, fragment] =
      packet.match(PACKET) ?? [];
    if (messageId) {
      const index = parseInt(indexStr);
      const total = parseInt(totalStr);

      const pending = mapEnsure(buffer, messageId, (): Pending => [[], total]);
      const [fragments] = pending;

      if (fragments[index] == null) {
        fragments[index] = fragment;
        pending[1]--;
      }

      if (pending[1] === 0) {
        buffer.delete(messageId);
        await receiveFinalMessage?.(jsonParse(fragments.join('')));
      }
    }
  };

  const sendPackets = async (message: Message): Promise<void> => {
    if (sendPacket) {
      const messageId = getUniqueId();
      const fragments = jsonStringify(message).match(messageSplit) ?? [];
      const total = fragments.length;
      await Promise.all(
        fragments.map((fragment, index) =>
          sendPacket([messageId, index, total, fragment].join(' ')),
        ),
      );
    }
  };

  return [startBuffer, stopBuffer, receivePacket, sendPackets];
};
