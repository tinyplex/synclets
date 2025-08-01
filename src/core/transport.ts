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
  let connected = false;
  let attachedSynclet: ProtectedSynclet | undefined;

  const attachToSynclet = (synclet: ProtectedSynclet) => {
    if (attachedSynclet) {
      errorNew('Transport is already attached to a Synclet');
    }
    attachedSynclet = synclet;
  };

  const connect = async (receive: (message: string) => Promise<void>) => {
    await connectImpl?.(async (message: string) => {
      // eslint-disable-next-line no-console
      console.log('receive', message);
      await receive(message);
    });
    connected = true;
  };

  const disconnect = async () => {
    await disconnectImpl?.();
    connected = false;
  };

  const getConnected = () => connected;

  const send = async (message: string) => {
    // eslint-disable-next-line no-console
    console.log('send', message);
    await sendImpl?.(message);
  };

  return {
    __brand: 'Transport',
    attachToSynclet,
    connect,
    disconnect,
    getConnected,
    send,
  };
};
