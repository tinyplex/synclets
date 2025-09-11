import type {
  createTransport as createTransportDecl,
  LogLevel,
  Synclet,
  TransportImplementations,
  TransportOptions,
} from '@synclets/@types';
import {EMPTY_STRING, errorNew} from '@synclets/utils';
import {getPacketFunctions} from './packets.ts';
import type {ProtectedTransport, ReceiveMessage} from './protected.js';

export {getPacketFromParts, getPartsFromPacket} from './packets.ts';

export const createTransport: typeof createTransportDecl = async (
  {
    connect: connectImpl,
    disconnect: disconnectImpl,
    sendPacket,
  }: TransportImplementations,
  options: TransportOptions = {},
): Promise<ProtectedTransport> => {
  let attachedSynclet: Synclet | undefined;
  const logger = options.logger ?? {};

  // #region public

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(
      `[${attachedSynclet?.getId() ?? EMPTY_STRING}/T] ${string}`,
    );

  const [startBuffer, stopBuffer, receivePacket, sendPackets] =
    getPacketFunctions(log, sendPacket, options.fragmentSize ?? 4096);

  // #endregion

  // #region protected

  const attachToSynclet = (synclet: Synclet) => {
    if (attachedSynclet) {
      errorNew(
        'Transport is already attached to Synclet ' + attachedSynclet.getId(),
      );
    }
    attachedSynclet = synclet;
  };

  const connect = async (receiveMessage: ReceiveMessage) => {
    startBuffer(receiveMessage);
    await connectImpl?.(receivePacket);
  };

  const disconnect = async () => {
    stopBuffer();
    await disconnectImpl?.();
  };

  const sendMessage = sendPackets;

  // #endregion
  return {
    __brand: 'Transport',

    log,

    attachToSynclet,
    connect,
    disconnect,
    sendMessage,
  };
};
