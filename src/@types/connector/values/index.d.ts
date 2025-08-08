/// connector/values

import type {
  Connector,
  ConnectorOptions,
  Timestamp,
  Value,
} from '../../index.d.ts';

export type ValuesConnectorImplementations = {
  connect?: (valueSync: () => Promise<void>) => Promise<void>;
  getValuesHash?: () => Promise<number>;
  getValueIds?: () => Promise<string[]>;
  getValue?: (id: string) => Promise<Value>;
  getValueTimestamp?: (id: string) => Promise<Timestamp>;
  setValuesHash?: (hash: number) => Promise<void>;
  setValue?: (id: string, value: Value) => Promise<void>;
  setValueTimestamp?: (id: string, timestamp: Timestamp) => Promise<void>;
};

export function createValuesConnector(
  implementations?: ValuesConnectorImplementations,
  options?: ConnectorOptions,
): Connector;
