import type {
  Address,
  Hash,
  LogLevel,
  Synclet,
  Timestamp,
  Value,
  createConnector as createConnectorDecl,
} from '@synclets/@types';
import {errorNew} from '@synclets/utils';
import type {ProtectedConnector} from '../protected.d.ts';

export const createConnector: typeof createConnectorDecl = ({
  connect: connectImpl,
  disconnect: disconnectImpl,
  get: getImpl,
  getHash: getHashImpl,
  getTimestamp: getTimestampImpl,
  set: setImpl,
  setHash: setHashImpl,
  setTimestamp: setTimestampImpl,
}: {
  connect?: (sync: (address: Address) => Promise<void>) => Promise<void>;
  disconnect?: () => Promise<void>;
  get?: (address: Address) => Promise<Value>;
  getTimestamp?: (address: Address) => Promise<Timestamp>;
  getHash?: (address: Address) => Promise<Hash>;
  set?: (address: Address, value: Value) => Promise<void>;
  setTimestamp?: (address: Address, timestamp: Timestamp) => Promise<void>;
  setHash?: (address: Address, hash: Hash) => Promise<void>;
} = {}): ProtectedConnector => {
  let attachedSynclet: Synclet | undefined;

  // #region protected

  const attachToSynclet = (synclet: Synclet) => {
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

  const get = async (address: Address) => (await getImpl?.(address)) ?? null;

  const getTimestamp = async (address: Address) =>
    (await getTimestampImpl?.(address)) ?? '';

  const getHash = async (address: Address) =>
    (await getHashImpl?.(address)) ?? 0;

  const set = async (address: Address, value: Value) =>
    await setImpl?.(address, value);

  const setTimestamp = async (address: Address, timestamp: Timestamp) =>
    await setTimestampImpl?.(address, timestamp);

  const setHash = async (address: Address, hash: Hash) =>
    await setHashImpl?.(address, hash);

  // #endregion

  // #region public

  const getSyncletId = () => attachedSynclet?.getId();

  const log = (string: string, level: LogLevel = 'info') =>
    attachedSynclet?.log('[connector] ' + string, level);

  // #endregion

  return {
    __brand: 'Connector',

    attachToSynclet,
    connect,
    disconnect,
    get,
    getTimestamp,
    getHash,
    set,
    setTimestamp,
    setHash,

    getSyncletId,
    log,
  };
};
