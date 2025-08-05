/// connector/value

import type {
  Connector,
  ConnectorOptions,
  Timestamp,
  Value,
} from '../../index.d.ts';

export function createValueConnector(
  implementations?: {
    connect?: (valueSync: () => Promise<void>) => Promise<void>;
    getValue?: () => Promise<Value>;
    getValueHash?: () => Promise<number>;
    getValueTimestamp?: () => Promise<Timestamp>;
    setValue?: (value: Value) => Promise<void>;
    setValueHash?: (hash: number) => Promise<void>;
    setValueTimestamp?: (timestamp: Timestamp) => Promise<void>;
  },
  options?: ConnectorOptions,
): Connector;
