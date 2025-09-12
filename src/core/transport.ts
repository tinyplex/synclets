import type {
  createTransport as createTransportDecl,
  LogLevel,
  Synclet,
  TransportImplementations,
  TransportOptions,
} from '@synclets/@types';
import {errorNew, getUniqueId} from '@synclets/utils';
import {getPacketFunctions} from './packets.ts';
import type {ProtectedTransport, ReceiveMessage} from './protected.js';

export {getPacketFromParts, getPartsFromPacket} from './packets.ts';

export const createTransport: typeof createTransportDecl = async (
  {connect, disconnect, sendPacket}: TransportImplementations,
  options: TransportOptions = {},
): Promise<ProtectedTransport> => {
  let connected = false;
  let attachedSynclet: Synclet | undefined;
  let id = options.id ?? getUniqueId();

  const logger = options.logger ?? {};

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[${id}/T] ${string}`);

  const [startBuffer, stopBuffer, receivePacket, sendPackets] =
    getPacketFunctions(log, sendPacket, options.fragmentSize ?? 4096);

  return {
    __brand: 'Transport',

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

    sendMessage: sendPackets,

    bind: (synclet: Synclet, syncletId: string) => {
      if (attachedSynclet) {
        errorNew('Transport is already attached to Synclet');
      }
      attachedSynclet = synclet;
      id = syncletId;
    },
  };
};
