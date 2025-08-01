/// connector/value

import type {Connector, Timestamp, Value} from '../../index.d.ts';

export function createValueConnector(implementations?: {
  connect?: (change: () => Promise<void>) => Promise<void>;
  getValue?: () => Promise<Value>;
  getValueTimestamp?: () => Promise<Timestamp>;
  setValue?: (value: Value) => Promise<void>;
  setValueTimestamp?: (timestamp: Timestamp) => Promise<void>;
}): Connector;
