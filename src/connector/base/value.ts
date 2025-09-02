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

  const connector = createConnector(
    {
      connect: async (sync: (address: Address) => Promise<void>) => {
        underlyingSync = () => sync([]);
        await underlyingConnect?.(underlyingSync);
      },

      disconnect: async () => {
        underlyingSync = undefined;
        await underlyingDisconnect?.();
      },

      getValue: getUnderlyingValue,

      getTimestamp: getUnderlyingValueTimestamp,

      getHash: async () => undefined,

      setValue: (_address: Address, value: Value) => setUnderlyingValue(value),

      setTimestamp: (_address: Address, timestamp: Timestamp) =>
        setUnderlyingValueTimestamp(timestamp),

      setHash: async () => {},

      hasChildren: async () => false,

      getChildren: async () => [],
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
