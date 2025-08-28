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

export const createBaseValueConnector: typeof createBaseValueConnectorDecl = (
  {
    connect: connectImpl,
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
    await connectImpl?.(underlyingSync);
  };

  const get = getUnderlyingValue;

  const getTimestamp = getUnderlyingValueTimestamp;

  const set = async (_address: Address, value: Value): Promise<void> =>
    await setUnderlyingValue(value);

  const setTimestamp = async (
    _address: Address,
    timestamp: Timestamp,
  ): Promise<void> => await setUnderlyingValueTimestamp(timestamp);

  const connector = createConnector(
    {connect, get, getTimestamp, set, setTimestamp},
    options,
  );

  // --

  const getValue = getUnderlyingValue;

  const setValue = async (value: Value): Promise<void> => {
    await setUnderlyingValue?.(value);
    await setUnderlyingValueTimestamp(connector.getNextTimestamp());
    await underlyingSync?.();
  };

  return {...connector, getValue, setValue};
};
