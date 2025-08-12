/// connector/values

import type {
  Connector,
  ConnectorOptions,
  Hash,
  Timestamp,
  Value,
} from '../../index.d.ts';

export type ValuesConnectorImplementations = {
  connect?: (sync: (valueId?: string) => Promise<void>) => Promise<void>;
  getValuesHash?: () => Promise<Hash>;
  getValueIds?: () => Promise<string[]>;
  getValue?: (valueId: string) => Promise<Value>;
  getValueTimestamp?: (valueId: string) => Promise<Timestamp>;
  setValuesHash?: (hash: Hash) => Promise<void>;
  setValue?: (valueId: string, value: Value) => Promise<void>;
  setValueTimestamp?: (valueId: string, timestamp: Timestamp) => Promise<void>;
};

export function createValuesConnector(
  implementations?: ValuesConnectorImplementations,
  options?: ConnectorOptions,
): Connector;
