import {createConnector} from '@synclets';
import type {
  Address,
  Connector,
  ConnectorOptions,
  Timestamp,
  Value,
} from '@synclets/@types';
import type {
  createValuesConnector as createValuesConnectorDecl,
  ValuesConnectorImplementations,
} from '@synclets/@types/connector/values';
import {isEmpty} from '@synclets/utils';

export const createValuesConnector: typeof createValuesConnectorDecl = (
  {
    connect: connectImpl,
    getValuesHash,
    getValueIds,
    getValue,
    getValueTimestamp,
    setValuesHash,
    setValue,
    setValueTimestamp,
  }: ValuesConnectorImplementations = {},
  options?: ConnectorOptions,
): Connector => {
  const connect = async (sync: (address: Address) => Promise<void>) =>
    await connectImpl?.(sync);

  const get = async ([id]: Address): Promise<Value> =>
    (await getValue?.(id)) ?? null;

  const getTimestamp = async ([id]: Address): Promise<Timestamp> =>
    (await getValueTimestamp?.(id)) ?? '';

  const getHash = async (): Promise<number> => (await getValuesHash?.()) ?? 0;

  const set = async ([id]: Address, value: Value): Promise<void> =>
    await setValue?.(id, value);

  const setTimestamp = async (
    [id]: Address,
    timestamp: Timestamp,
  ): Promise<void> => await setValueTimestamp?.(id, timestamp);

  const setHash = async (_address: Address, hash: number): Promise<void> =>
    await setValuesHash?.(hash);

  const hasChildren = async (address: Address): Promise<boolean> =>
    isEmpty(address);

  const getChildren = async (): Promise<string[]> =>
    (await getValueIds?.()) ?? [];

  return createConnector(
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
};
