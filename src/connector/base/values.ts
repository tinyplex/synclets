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
import {getTimestampHash, isEmpty, isUndefined} from '@synclets/utils';

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

  const get = async ([valueId]: Address): Promise<Value> =>
    await getUnderlyingValue(valueId);

  const getTimestamp = async ([valueId]: Address): Promise<Timestamp> =>
    await getUnderlyingValueTimestamp(valueId);

  const getHash = getUnderlyingValuesHash;

  const set = async ([valueId]: Address, value: Value): Promise<void> =>
    await setUnderlyingValue(valueId, value);

  const setTimestamp = async (
    [valueId]: Address,
    timestamp: Timestamp,
  ): Promise<void> => await setUnderlyingValueTimestamp(valueId, timestamp);

  const setHash = async (_address: Address, hash: number): Promise<void> =>
    await setUnderlyingValuesHash(hash);

  const hasChildren = async (address: Address): Promise<boolean> =>
    isEmpty(address);

  const getChildren = async (): Promise<string[]> =>
    (await getValueIds?.()) ?? [];

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

  return {...connector, getValueIds, getValue, setValue};
};
