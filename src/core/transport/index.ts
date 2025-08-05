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

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[${getSyncletId()}/T] ${string}`);

  const [startBuffer, stopBuffer, receivePacket, sendPackets] =
    getPacketFunctions(log, sendPacket, fragmentSize);

  // #region protected

  const attachToSynclet = (synclet: Synclet) => {
    if (attachedSynclet) {
      errorNew('Transport is already attached to Synclet ' + getSyncletId());
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

  // #region public

  const getSyncletId = () => attachedSynclet?.getId();

  // #endregion

  return {
    __brand: 'Transport',

    attachToSynclet,
    connect,
    disconnect,
    sendMessage,

    getSyncletId,
    log,
  };
};
