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
    setValue,
    setValueTimestamp,
  }: ValueConnectorImplementations = {},
  options?: ConnectorOptions,
): Connector => {
  const connect = async (sync: (address: Address) => Promise<void>) =>
    await connectImpl?.(() => sync([]));

  const get = async (): Promise<Value> => (await getValue?.()) ?? null;

  const getTimestamp = async (): Promise<Timestamp> =>
    (await getValueTimestamp?.()) ?? '';

  const set = async (_address: Address, value: Value): Promise<void> =>
    await setValue?.(value);

  const setTimestamp = async (
    _address: Address,
    timestamp: Timestamp,
  ): Promise<void> => await setValueTimestamp?.(timestamp);

  return createConnector(
    {connect, get, getTimestamp, set, setTimestamp},
    options,
  );
};
