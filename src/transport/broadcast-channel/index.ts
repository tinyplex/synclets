import {createTransport} from '@synclets';
import type {TransportOptions} from '@synclets/@types';
import type {
  BroadcastChannelTransport,
  createBroadcastChannelTransport as createBroadcastChannelTransportDecl,
} from '@synclets/@types/transport/broadcast-channel';
import {
  getPacketFromParts,
  getPartsFromPacket,
  getUniqueId,
} from '@synclets/utils';
import {objFreeze} from '../../common/object.ts';
import {ASTERISK} from '../../common/string.ts';

const addEventListener = (
  channel: BroadcastChannel,
  event: keyof BroadcastChannelEventMap,
  handler: (...args: any[]) => void,
) => {
  channel.addEventListener(event, handler);
  return () => channel.removeEventListener(event, handler);
};

export const createBroadcastChannelTransport: typeof createBroadcastChannelTransportDecl =
  (
    channelName: string,
    options?: TransportOptions,
  ): BroadcastChannelTransport => {
    const id = getUniqueId();
    let channel: BroadcastChannel;
    let removeMessageListener: (() => void) | undefined;

    const connect = async (
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

    const disconnect = async (): Promise<void> => {
      removeMessageListener?.();
      channel.close();
    };

    const sendPacket = async (packet: string): Promise<void> =>
      channel.postMessage({from: id, packet});

    const transport = createTransport(
      {connect, disconnect, sendPacket},
      options,
    );

    return objFreeze({
      ...transport,
      getChannelName: () => channelName,
    }) as BroadcastChannelTransport;
  };
