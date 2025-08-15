/// connector/tables

import type {
  Connector,
  ConnectorOptions,
  Hash,
  Timestamp,
  Value,
} from '../../index.js';

export type TablesConnectorImplementations = {
  connect?: (
    sync: (tableId?: string, rowId?: string, cellId?: string) => Promise<void>,
  ) => Promise<void>;
  getTablesHash?: () => Promise<Hash>;
  getTableIds?: () => Promise<string[]>;
  getTableHash?: (tableId: string) => Promise<Hash>;
  getRowIds?: (tableId: string) => Promise<string[]>;
  getRowHash?: (tableId: string, rowId: string) => Promise<Hash>;
  getCellIds?: (tableId: string, rowId: string) => Promise<string[]>;
  getCell?: (tableId: string, rowId: string, cellId: string) => Promise<Value>;
  getCellTimestamp?: (
    tableId: string,
    rowId: string,
    cellId: string,
  ) => Promise<Timestamp>;

  setTablesHash?: (hash: Hash) => Promise<void>;
  setTableHash?: (tableId: string, hash: Hash) => Promise<void>;
  setRowHash?: (tableId: string, rowId: string, hash: Hash) => Promise<void>;
  setCell?: (
    tableId: string,
    rowId: string,
    cellId: string,
    value: Value,
  ) => Promise<void>;
  setCellTimestamp?: (
    tableId: string,
    rowId: string,
    cellId: string,
    timestamp: Timestamp,
  ) => Promise<void>;
};

export function createTablesConnector(
  implementations?: TablesConnectorImplementations,
  options?: ConnectorOptions,
): Connector;
