import {createConnector} from '@synclets';
import type {
  Address,
  ConnectorOptions,
  Timestamp,
  Value,
} from '@synclets/@types';
import type {
  BaseValueConnector,
  BaseValueConnectorImplementations,
  createBaseValueConnector as createBaseValueConnectorDecl,
} from '@synclets/@types/connector/base';
import {DELETED_VALUE} from '@synclets/utils';

export const createBaseValueConnector: typeof createBaseValueConnectorDecl = (
  {
    underlyingConnect,
    underlyingDisconnect,
    getUnderlyingValue,
    getUnderlyingValueTimestamp,
    setUnderlyingValue,
    setUnderlyingValueTimestamp,
  }: BaseValueConnectorImplementations,
  options?: ConnectorOptions,
): BaseValueConnector => {
  let underlyingSync: (() => Promise<void>) | undefined;

  const connect = async (sync: (address: Address) => Promise<void>) => {
    underlyingSync = () => sync([]);
    await underlyingConnect?.(underlyingSync);
  };

  const disconnect = async () => {
    underlyingSync = undefined;
    await underlyingDisconnect?.();
  };

  const get = getUnderlyingValue;

  const getTimestamp = getUnderlyingValueTimestamp;

  const getHash = async () => 0;

  const set = (_address: Address, value: Value): Promise<void> =>
    setUnderlyingValue(value);

  const setTimestamp = (
    _address: Address,
    timestamp: Timestamp,
  ): Promise<void> => setUnderlyingValueTimestamp(timestamp);

  const setHash = async () => {};

  const hasChildren = async () => false;

  const getChildren = async () => [];

  const connector = createConnector(
    {
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
    },
    options,
  );

  // --

  const getValue = getUnderlyingValue;

  const setValue = async (value: Value): Promise<void> => {
    await setUnderlyingValue?.(value);
    await setUnderlyingValueTimestamp(connector.getNextTimestamp());
    await underlyingSync?.();
  };

  const delValue = (): Promise<void> => setValue(DELETED_VALUE);

  return {...connector, getValue, setValue, delValue};
};
