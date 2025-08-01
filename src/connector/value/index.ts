import {createConnector} from '@synclets';
import type {Address, Connector, Timestamp, Value} from '@synclets/@types';
import type {createValueConnector as createValueConnectorDecl} from '@synclets/@types/connector/value';

export const createValueConnector: typeof createValueConnectorDecl = ({
  connect: connectImpl,
  getValue,
  getValueTimestamp,
  setValue,
  setValueTimestamp,
}: {
  connect?: (change: () => Promise<void>) => Promise<void>;
  getValue?: () => Promise<Value>;
  getValueTimestamp?: () => Promise<Timestamp>;
  setValue?: (value: Value) => Promise<void>;
  setValueTimestamp?: (timestamp: Timestamp) => Promise<void>;
} = {}): Connector => {
  const connect = async (change: (address: Address) => Promise<void>) =>
    await connectImpl?.(() => change([]));

  const getNode = async (): Promise<Value> => (await getValue?.()) ?? null;

  const getNodeTimestamp = async (): Promise<Timestamp> =>
    (await getValueTimestamp?.()) ?? '';

  const setNode = async (_address: Address, value: Value): Promise<void> =>
    await setValue?.(value);

  const setNodeTimestamp = async (
    _address: Address,
    timestamp: Timestamp,
  ): Promise<void> => await setValueTimestamp?.(timestamp);

  return createConnector({
    connect,
    getNode,
    getNodeTimestamp,
    setNode,
    setNodeTimestamp,
  });
};
