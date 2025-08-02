import type {createTransport as createTransportDecl} from '@synclets/@types';
import {errorNew} from '@synclets/utils';
import type {
  Message,
  ProtectedSynclet,
  ProtectedTransport,
} from './protected.d.ts';

export const createTransport: typeof createTransportDecl = ({
  connect: connectImpl,
  disconnect: disconnectImpl,
  sendPacket,
}: {
  connect?: (receivePacket: (packet: string) => Promise<void>) => Promise<void>;
  disconnect?: () => Promise<void>;
  sendPacket?: (packet: string) => Promise<void>;
} = {}): ProtectedTransport => {
  let attachedSynclet: ProtectedSynclet | undefined;

  // #region protected

  const attachToSynclet = (synclet: ProtectedSynclet) => {
    if (attachedSynclet) {
      errorNew('Transport is already attached to Synclet ' + getSyncletId());
    }
    attachedSynclet = synclet;
  };

  const connect = async (receiveMessage: (message: Message) => Promise<void>) =>
    await connectImpl?.((packet) => receiveMessage(JSON.parse(packet)));

  const disconnect = async () => await disconnectImpl?.();

  const sendMessage = async (message: Message) =>
    await sendPacket?.(JSON.stringify(message));

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
  };
};
