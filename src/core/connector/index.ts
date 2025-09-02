import type {
  Address,
  ConnectorImplementations,
  ConnectorOptions,
  Context,
  Hash,
  LogLevel,
  Synclet,
  Timestamp,
  Value,
  createConnector as createConnectorDecl,
} from '@synclets/@types';
import {errorNew, getHlcFunctions} from '@synclets/utils';
import type {ProtectedConnector} from '../protected.d.ts';

export const createConnector: typeof createConnectorDecl = (
  {
    connect: connectImpl,
    disconnect: disconnectImpl,
    getValue: getValueImpl,
    getHash: getHashImpl,
    getTimestamp: getTimestampImpl,
    setValue: setValueImpl,
    setHash: setHashImpl,
    setTimestamp: setTimestampImpl,
    hasChildren: hasChildrenImpl,
    getChildren: getChildrenImpl,
  }: ConnectorImplementations,
  options: ConnectorOptions = {},
): ProtectedConnector => {
  let attachedSynclet: Synclet | undefined;
  const logger = options.logger ?? {};

  // #region public

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[${attachedSynclet?.getId() ?? ''}/C] ${string}`);

  const [getNextTimestamp, seenTimestamp, setUniqueId] = getHlcFunctions();

  // #endregion

  // #region protected

  const attachToSynclet = (synclet: Synclet) => {
    if (attachedSynclet) {
      errorNew(
        'Connector is already attached to Synclet ' + attachedSynclet.getId(),
      );
    }
    attachedSynclet = synclet;
    setUniqueId(attachedSynclet.getId());
  };

  const connect = async (sync: (address: Address) => Promise<void>) =>
    await connectImpl?.(sync);

  const disconnect = async () => await disconnectImpl?.();

  const getValue = async (address: Address, context: Context) =>
    await getValueImpl(address, context);

  const getTimestamp = async (address: Address, context: Context) =>
    (await getTimestampImpl(address, context)) ?? '';

  const getHash = async (address: Address, context: Context) =>
    (await getHashImpl(address, context)) ?? 0;

  const setValue = async (address: Address, value: Value, context: Context) =>
    await setValueImpl(address, value, context);

  const setTimestamp = async (
    address: Address,
    timestamp: Timestamp,
    context: Context,
  ) => {
    seenTimestamp(timestamp);
    await setTimestampImpl(address, timestamp, context);
  };

  const setHash = async (address: Address, hash: Hash, context: Context) =>
    await setHashImpl(address, hash, context);

  const hasChildren = async (address: Address, context: Context) =>
    (await hasChildrenImpl(address, context)) ?? false;

  const getChildren = async (address: Address, context: Context) =>
    (await getChildrenImpl(address, context)) ?? [];

  // --

  const getTimestampAndValue = async (
    address: Address,
    context: Context,
    timestamp?: Timestamp,
  ): Promise<[Timestamp, Value | undefined]> => [
    timestamp ?? (await getTimestamp(address, context)),
    await getValue(address, context),
  ];

  const getHashOrTimestamp = async (
    address: Address,
    context: Context,
  ): Promise<Hash | Timestamp> =>
    await ((await hasChildren(address, context)) ? getHash : getTimestamp)(
      address,
      context,
    );

  const setTimestampAndValue = async (
    address: Address,
    timestamp: Timestamp,
    value: Value,
    context: Context,
  ): Promise<void> => {
    log(`set(${address})`);
    await setValue(address, value, context);
    await setTimestamp(address, timestamp, context);
  };

  // #endregion

  return {
    __brand: 'Connector',

    getNextTimestamp,
    log,

    attachToSynclet,
    connect,
    disconnect,
    getValue,
    getTimestamp,
    getHash,
    setValue,
    setTimestamp,
    setHash,
    hasChildren,
    getChildren,

    getTimestampAndValue,
    getHashOrTimestamp,
    setTimestampAndValue,
  };
};
