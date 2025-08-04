import type {
  createTransport as createTransportDecl,
  LogLevel,
  Synclet,
} from '@synclets/@types';
import {errorNew} from '@synclets/utils';
import type {
  Message,
  ProtectedTransport,
  ReceiveMessage,
} from '../protected.d.ts';
import {getPacketFunctions} from './packets.ts';

export const createTransport: typeof createTransportDecl = ({
  connect: connectImpl,
  disconnect: disconnectImpl,
  sendPacket,
  fragmentSize,
}: {
  connect?: (receivePacket: (packet: string) => Promise<void>) => Promise<void>;
  disconnect?: () => Promise<void>;
  sendPacket?: (packet: string) => Promise<void>;
  fragmentSize?: number;
} = {}): ProtectedTransport => {
  let attachedSynclet: Synclet | undefined;

  const [startBuffer, stopBuffer, receivePacket, sendPackets] =
    getPacketFunctions(sendPacket, fragmentSize);

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

  const sendMessage = (message: Message) => sendPackets(message);

  // #endregion

  // #region public

  const getSyncletId = () => attachedSynclet?.getId();

  const log = (string: string, level: LogLevel = 'info') =>
    attachedSynclet?.log('[transport] ' + string, level);

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
