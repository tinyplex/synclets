import {createConnector} from '@synclets';
import type {
  Address,
  Connector,
  ConnectorOptions,
  Timestamp,
  Value,
} from '@synclets/@types';
import type {
  createValueConnector as createValueConnectorDecl,
  ValueConnectorImplementations,
} from '@synclets/@types/connector/value';

export const createValueConnector: typeof createValueConnectorDecl = (
  {
    connect: connectImpl,
    getValue,
    getValueTimestamp,
    getValueHash,
    setValue,
    setValueTimestamp,
    setValueHash,
  }: ValueConnectorImplementations = {},
  options?: ConnectorOptions,
): Connector => {
  const connect = async (sync: (address: Address) => Promise<void>) =>
    await connectImpl?.(() => sync([]));

  const get = async (): Promise<Value> => (await getValue?.()) ?? null;

  const getTimestamp = async (): Promise<Timestamp> =>
    (await getValueTimestamp?.()) ?? '';

  const getHash = async (): Promise<number> => (await getValueHash?.()) ?? 0;

  const set = async (_address: Address, value: Value): Promise<void> =>
    await setValue?.(value);

  const setTimestamp = async (
    _address: Address,
    timestamp: Timestamp,
  ): Promise<void> => await setValueTimestamp?.(timestamp);

  const setHash = async (_address: Address, hash: number): Promise<void> =>
    await setValueHash?.(hash);

  return createConnector(
    {
      connect,
      get,
      getTimestamp,
      getHash,
      set,
      setTimestamp,
      setHash,
    },
    options,
  );
};
