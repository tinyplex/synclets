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
    connect: connectImpl,
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

  const connect = async (sync: (address: Address) => Promise<void>) => {
    underlyingSync = (valueId) =>
      isUndefined(valueId) ? sync([]) : sync([valueId]);
    await connectImpl?.(underlyingSync);
  };

  const get = ([valueId]: Address): Promise<Value> =>
    getUnderlyingValue(valueId);

  const getTimestamp = ([valueId]: Address): Promise<Timestamp> =>
    getUnderlyingValueTimestamp(valueId);

  const getHash = getUnderlyingValuesHash;

  const set = ([valueId]: Address, value: Value): Promise<void> =>
    setUnderlyingValue(valueId, value);

  const setTimestamp = (
    [valueId]: Address,
    timestamp: Timestamp,
  ): Promise<void> => setUnderlyingValueTimestamp(valueId, timestamp);

  const setHash = (_address: Address, hash: number): Promise<void> =>
    setUnderlyingValuesHash(hash);

  const hasChildren = async (address: Address): Promise<boolean> =>
    isEmpty(address);

  const getChildren = async (address: Address): Promise<string[]> =>
    isEmpty(address) ? await getValueIds() : [];

  const connector = createConnector(
    {
      connect,
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
