import {createConnector} from '@synclets';
import type {
  Address,
  ConnectorOptions,
  Timestamp,
  Value,
} from '@synclets/@types';
import type {
  BaseValuesConnector,
  BaseValuesConnectorImplementations,
  createBaseValuesConnector as createBaseValuesConnectorDecl,
} from '@synclets/@types/connector/base';
import {
  DELETED_VALUE,
  getTimestampHash,
  isEmpty,
  isUndefined,
} from '@synclets/utils';

export const createBaseValuesConnector: typeof createBaseValuesConnectorDecl = (
  {
    underlyingConnect,
    underlyingDisconnect,
    getUnderlyingValuesHash,
    getUnderlyingValueIds,
    getUnderlyingValue,
    getUnderlyingValueTimestamp,
    setUnderlyingValuesHash,
    setUnderlyingValue,
    setUnderlyingValueTimestamp,
  }: BaseValuesConnectorImplementations,
  options?: ConnectorOptions,
): BaseValuesConnector => {
  let underlyingSync: ((valueId?: string) => Promise<void>) | undefined;

  const connector = createConnector(
    {
      connect: async (sync: (address: Address) => Promise<void>) => {
        underlyingSync = (valueId) =>
          isUndefined(valueId) ? sync([]) : sync([valueId]);
        await underlyingConnect?.(underlyingSync);
      },

      disconnect: async () => {
        underlyingSync = undefined;
        await underlyingDisconnect?.();
      },

      getValue: ([valueId]: Address) => getUnderlyingValue(valueId),

      getTimestamp: ([valueId]: Address) =>
        getUnderlyingValueTimestamp(valueId),

      getHash: getUnderlyingValuesHash,

      setValue: ([valueId]: Address, value: Value) =>
        setUnderlyingValue(valueId, value),

      setTimestamp: ([valueId]: Address, timestamp: Timestamp) =>
        setUnderlyingValueTimestamp(valueId, timestamp),

      setHash: (_address: Address, hash: number) =>
        setUnderlyingValuesHash(hash),

      hasChildren: async (address: Address) => isEmpty(address),

      getChildren: async (address: Address) =>
        isEmpty(address) ? await getValueIds() : [],
    },
    options,
  );

  // --

  const getValueIds = getUnderlyingValueIds;

  const getValue = getUnderlyingValue;

  const setValue = async (valueId: string, value: Value): Promise<void> => {
    const timestamp = connector.getNextTimestamp();
    const hashChange =
      getTimestampHash(await getUnderlyingValueTimestamp(valueId)) ^
      getTimestampHash(timestamp);

    await setUnderlyingValue(valueId, value);
    await setUnderlyingValueTimestamp(valueId, timestamp);
    await setUnderlyingValuesHash(
      ((await getUnderlyingValuesHash()) ^ hashChange) >>> 0,
    );
    await underlyingSync?.(valueId);
  };

  const delValue = (valueId: string): Promise<void> =>
    setValue(valueId, DELETED_VALUE);

  return {...connector, getValueIds, getValue, setValue, delValue};
};
