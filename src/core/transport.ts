import type {createTransport as createTransportDecl} from '@synclets/@types';
import {errorNew} from '@synclets/utils';
import type {ProtectedSynclet, ProtectedTransport} from './protected.d.ts';

export const createTransport: typeof createTransportDecl = ({
  connect: connectImpl,
  disconnect: disconnectImpl,
  send: sendImpl,
}: {
  connect?: (receive: (message: string) => Promise<void>) => Promise<void>;
  disconnect?: () => Promise<void>;
  send?: (message: string) => Promise<void>;
} = {}): ProtectedTransport => {
  let attachedSynclet: ProtectedSynclet | undefined;

  // #region protected

  const attachToSynclet = (synclet: ProtectedSynclet) => {
    if (attachedSynclet) {
      errorNew('Transport is already attached to Synclet ' + getSyncletId());
    }
    attachedSynclet = synclet;
  };

  const connect = async (receive: (message: string) => Promise<void>) =>
    await connectImpl?.(receive);

  const disconnect = async () => await disconnectImpl?.();

  const send = async (message: string) => await sendImpl?.(message);

  // #endregion

  // #region public

  const getSyncletId = () => attachedSynclet?.getId();

  // #endregion

  return {
    __brand: 'Transport',

    attachToSynclet,
    connect,
    disconnect,
    send,

    getSyncletId,
  };
};
