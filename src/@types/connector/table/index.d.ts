/// connector/table

import type {
  Connector,
  ConnectorOptions,
  Hash,
  Timestamp,
  Value,
} from '../../index.js';

export type TableConnectorImplementations = {
  connect?: (
    sync: (rowId?: string, cellId?: string) => Promise<void>,
  ) => Promise<void>;
  getTableHash?: () => Promise<Hash>;
  getRowIds?: () => Promise<string[]>;
  getRowHash?: (id: string) => Promise<Hash>;
  getCellIds?: (rowId: string) => Promise<string[]>;
  getCell?: (rowId: string, cellId: string) => Promise<Value>;
  getCellTimestamp?: (rowId: string, cellId: string) => Promise<Timestamp>;

  setTableHash?: (hash: Hash) => Promise<void>;
  setRowHash?: (rowId: string, hash: Hash) => Promise<void>;
  setCell?: (rowId: string, cellId: string, value: Value) => Promise<void>;
  setCellTimestamp?: (
    rowId: string,
    cellId: string,
    timestamp: Timestamp,
  ) => Promise<void>;
};

export function createTableConnector(
  implementations?: TableConnectorImplementations,
  options?: ConnectorOptions,
): Connector;
