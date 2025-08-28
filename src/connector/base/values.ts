import {createConnector} from '@synclets';
import type {
  Address,
  Connector,
  ConnectorOptions,
  Timestamp,
  Value,
} from '@synclets/@types';
import type {
  ValuesConnectorImplementations,
  createBaseValuesConnector as createBaseValuesConnectorDecl,
} from '@synclets/@types/connector/base';
import {isEmpty} from '@synclets/utils';

export const createBaseValuesConnector: typeof createBaseValuesConnectorDecl = (
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
    await connectImpl?.((valueId?: string) =>
      valueId != null ? sync([valueId]) : sync([]),
    );

  const get = async ([valueId]: Address): Promise<Value> =>
    (await getValue?.(valueId)) ?? null;

  const getTimestamp = async ([valueId]: Address): Promise<Timestamp> =>
    (await getValueTimestamp?.(valueId)) ?? '';

  const getHash = async (): Promise<number> => (await getValuesHash?.()) ?? 0;

  const set = async ([valueId]: Address, value: Value): Promise<void> =>
    await setValue?.(valueId, value);

  const setTimestamp = async (
    [valueId]: Address,
    timestamp: Timestamp,
  ): Promise<void> => await setValueTimestamp?.(valueId, timestamp);

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
