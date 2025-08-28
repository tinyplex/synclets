import type {
  createTransport as createTransportDecl,
  LogLevel,
  Synclet,
  TransportImplementations,
  TransportOptions,
} from '@synclets/@types';
import {errorNew} from '@synclets/utils';
import type {ProtectedTransport, ReceiveMessage} from '../protected.d.ts';
import {getPacketFunctions} from './packets.ts';

export {getPacketFromParts, getPartsFromPacket} from './packets.ts';

export const createTransport: typeof createTransportDecl = (
  {
    connect: connectImpl,
    disconnect: disconnectImpl,
    sendPacket,
    fragmentSize,
  }: TransportImplementations = {},
  options: TransportOptions = {},
): ProtectedTransport => {
  let attachedSynclet: Synclet | undefined;
  const logger = options.logger ?? {};

  // #region public

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[${attachedSynclet?.getId() ?? ''}/T] ${string}`);

  const [startBuffer, stopBuffer, receivePacket, sendPackets] =
    getPacketFunctions(log, sendPacket, fragmentSize);

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
