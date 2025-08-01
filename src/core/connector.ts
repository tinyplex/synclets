import type {
  Address,
  Timestamp,
  Value,
  createConnector as createConnectorDecl,
} from '@synclets/@types';
import {errorNew} from '@synclets/utils';
import type {ProtectedConnector, ProtectedSynclet} from './protected.d.ts';

export const createConnector: typeof createConnectorDecl = ({
  connect: connectImpl,
  disconnect: disconnectImpl,
  getNode: getNodeImpl,
  getNodeTimestamp: getNodeTimestampImpl,
  setNode: setNodeImpl,
  setNodeTimestamp: setNodeTimestampImpl,
}: {
  connect?: (change: (address: Address) => Promise<void>) => Promise<void>;
  disconnect?: () => Promise<void>;
  getNode?: (address: Address) => Promise<Value>;
  getNodeTimestamp?: (address: Address) => Promise<Timestamp>;
  setNode?: (address: Address, value: Value) => Promise<void>;
  setNodeTimestamp?: (address: Address, timestamp: Timestamp) => Promise<void>;
} = {}): ProtectedConnector => {
  let connected = false;
  let attachedSynclet: ProtectedSynclet | undefined;

  const attachToSynclet = (synclet: ProtectedSynclet) => {
    if (attachedSynclet) {
      errorNew('Connector is already attached to a Synclet');
    }
    attachedSynclet = synclet;
  };

  const connect = async (change: (address: Address) => Promise<void>) => {
    await connectImpl?.(change);
    connected = true;
  };

  const disconnect = async () => {
    await disconnectImpl?.();
    connected = false;
  };

  const getConnected = () => connected;

  const getNode = async (address: Address) =>
    (await getNodeImpl?.(address)) ?? null;

  const getNodeTimestamp = async (address: Address) =>
    (await getNodeTimestampImpl?.(address)) ?? '';

  const setNode = async (address: Address, value: Value) =>
    await setNodeImpl?.(address, value);

  const setNodeTimestamp = async (address: Address, timestamp: Timestamp) =>
    await setNodeTimestampImpl?.(address, timestamp);

  return {
    __brand: 'Connector',
    attachToSynclet,
    connect,
    disconnect,
    getConnected,
    getNode,
    getNodeTimestamp,
    setNode,
    setNodeTimestamp,
  };
};
