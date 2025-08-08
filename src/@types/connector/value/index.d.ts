/// connector/value

import type {
  Connector,
  ConnectorOptions,
  Timestamp,
  Value,
} from '../../index.d.ts';

export type ValueConnectorImplementations = {
  connect?: (valueSync: () => Promise<void>) => Promise<void>;
  getValue?: () => Promise<Value>;
  getValueTimestamp?: () => Promise<Timestamp>;
  setValue?: (value: Value) => Promise<void>;
  setValueTimestamp?: (timestamp: Timestamp) => Promise<void>;
};

export function createValueConnector(
  implementations?: ValueConnectorImplementations,
  options?: ConnectorOptions,
): Connector;
