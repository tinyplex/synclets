import {createTransport} from '@synclets';
import type {
  BroadcastChannelTransport,
  BroadcastChannelTransportOptions,
  createBroadcastChannelTransport as createBroadcastChannelTransportDecl,
} from '@synclets/@types/browser';
import {
  getPacketFromParts,
  getPartsFromPacket,
  getUniqueId,
} from '@synclets/utils';
import {ASTERISK} from '../common/string.ts';

const addEventListener = (
  channel: BroadcastChannel,
  event: keyof BroadcastChannelEventMap,
  handler: (...args: any[]) => void,
) => {
  channel.addEventListener(event, handler);
  return () => channel.removeEventListener(event, handler);
};

export const createBroadcastChannelTransport: typeof createBroadcastChannelTransportDecl =
  ({
    channelName,
    ...options
  }: BroadcastChannelTransportOptions): BroadcastChannelTransport => {
    const id = getUniqueId();
    let channel: BroadcastChannel;
    let removeMessageListener: (() => void) | undefined;

    const attach = async (
      receivePacket: (packet: string) => Promise<void>,
    ): Promise<void> => {
      channel = new BroadcastChannel(channelName);
      removeMessageListener = addEventListener(
        channel,
        'message',
        async ({data: {from, packet}}) => {
          const [to, body] = getPartsFromPacket(packet);
          if (to == id || to == ASTERISK) {
            await receivePacket(getPacketFromParts(from, body));
          }
        },
      );
    };

    const detach = async (): Promise<void> => {
      removeMessageListener?.();
      channel.close();
    };

    const sendPacket = async (packet: string): Promise<void> =>
      channel.postMessage({from: id, packet});

    return createTransport({attach, detach, sendPacket}, options, {
      getChannelName: () => channelName,
    }) as BroadcastChannelTransport;
  };
