import type {
  createTransport as createTransportDecl,
  LogLevel,
  Synclet,
  TransportImplementations,
  TransportOptions,
} from '@synclets/@types';
import {getUniqueId} from '@synclets/utils';
import {errorNew} from '../common/other.ts';
import {getPacketFunctions} from './packets.ts';
import type {Message, ProtectedTransport, ReceiveMessage} from './protected.js';

export {getPacketFromParts, getPartsFromPacket} from './packets.ts';

export const createTransport: typeof createTransportDecl = async (
  {connect, disconnect, sendPacket}: TransportImplementations,
  options: TransportOptions = {},
): Promise<ProtectedTransport> => {
  let connected = false;
  let boundSynclet: Synclet | undefined;
  let id = options.id ?? getUniqueId();

  const logger = options.logger ?? {};

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[${id}/T] ${string}`);

  const [startBuffer, stopBuffer, receivePacket, sendPackets] =
    getPacketFunctions(log, sendPacket, options.fragmentSize ?? 4096);

  return {
    log,

    connect: async (receiveMessage: ReceiveMessage) => {
      if (!connected) {
        log('connect');
        startBuffer(receiveMessage);
        await connect?.(receivePacket);
        connected = true;
      }
    },

    disconnect: async () => {
      if (connected) {
        log('disconnect');
        stopBuffer();
        await disconnect?.();
        connected = false;
      }
    },

    isConnected: () => connected,

    sendMessage: async (message: Message, to?: string) => {
      if (connected) {
        await sendPackets(message, to);
      }
    },

    bind: (synclet: Synclet, syncletId: string) => {
      if (boundSynclet) {
        errorNew('Transport is already attached to Synclet');
      }
      boundSynclet = synclet;
      id = syncletId;
    },
  };
};
