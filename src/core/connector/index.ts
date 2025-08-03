import type {
  Address,
  Timestamp,
  Value,
  createConnector as createConnectorDecl,
} from '@synclets/@types';
import {errorNew} from '@synclets/utils';
import type {ProtectedConnector, ProtectedSynclet} from '../protected.d.ts';

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
  let attachedSynclet: ProtectedSynclet | undefined;

  // #region protected

  const attachToSynclet = (synclet: ProtectedSynclet) => {
    if (attachedSynclet) {
      errorNew(
        'Connector is already attached to Synclet ' + attachedSynclet.getId(),
      );
    }
    attachedSynclet = synclet;
  };

  const connect = async (sync: (address: Address) => Promise<void>) =>
    await connectImpl?.(sync);

  const disconnect = async () => await disconnectImpl?.();

  const getNode = async (address: Address) =>
    (await getNodeImpl?.(address)) ?? null;

  const getNodeTimestamp = async (address: Address) =>
    (await getNodeTimestampImpl?.(address)) ?? '';

  const setNode = async (address: Address, value: Value) =>
    await setNodeImpl?.(address, value);

  const setNodeTimestamp = async (address: Address, timestamp: Timestamp) =>
    await setNodeTimestampImpl?.(address, timestamp);

  // #endregion

  // #region public

  const getSyncletId = () => attachedSynclet?.getId();

  // #endregion

  return {
    __brand: 'Connector',

    attachToSynclet,
    connect,
    disconnect,
    getNode,
    getNodeTimestamp,
    setNode,
    setNodeTimestamp,

    getSyncletId,
  };
};
