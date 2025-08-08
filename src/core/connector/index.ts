import type {
  Address,
  ConnectorImplementations,
  ConnectorOptions,
  Hash,
  LogLevel,
  Synclet,
  Timestamp,
  Value,
  createConnector as createConnectorDecl,
} from '@synclets/@types';
import {errorNew} from '@synclets/utils';
import type {ProtectedConnector} from '../protected.d.ts';

export const createConnector: typeof createConnectorDecl = (
  {
    connect: connectImpl,
    disconnect: disconnectImpl,
    get: getImpl,
    getHash: getHashImpl,
    getTimestamp: getTimestampImpl,
    set: setImpl,
    setHash: setHashImpl,
    setTimestamp: setTimestampImpl,
    hasChildren: hasChildrenImpl,
    getChildren: getChildrenImpl,
  }: ConnectorImplementations = {},
  options: ConnectorOptions = {},
): ProtectedConnector => {
  let attachedSynclet: Synclet | undefined;
  const logger = options.logger ?? {};

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

  const hasChildren = async (address: Address) =>
    (await hasChildrenImpl?.(address)) ?? false;

  const getChildren = async (address: Address) =>
    (await getChildrenImpl?.(address)) ?? [];

  // #endregion

  // #region public

  const getSyncletId = () => attachedSynclet?.getId();

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[${getSyncletId()}/C] ${string}`);

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
    hasChildren,
    getChildren,

    getSyncletId,
    log,
  };
};
