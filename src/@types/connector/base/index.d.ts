/// connector/base

import type {
  Connector,
  ConnectorOptions,
  Hash,
  Timestamp,
  Value,
} from '../../index.d.ts';

export type BaseValueConnector = Connector & {
  getValue: () => Promise<Value>;
  setValue: (value: Value) => Promise<void>;
};

export type BaseValueConnectorImplementations = {
  connect?: (sync: () => Promise<void>) => Promise<void>;
  getUnderlyingValue: () => Promise<Value>;
  getUnderlyingValueTimestamp: () => Promise<Timestamp>;
  setUnderlyingValue: (value: Value) => Promise<void>;
  setUnderlyingValueTimestamp: (timestamp: Timestamp) => Promise<void>;
};

export function createBaseValueConnector(
  implementations: BaseValueConnectorImplementations,
  options?: ConnectorOptions,
): BaseValueConnector;

export type BaseValuesConnector = Connector & {
  getValueIds: (valueId: string) => Promise<string[]>;
  getValue: (valueId: string) => Promise<Value>;
  setValue: (valueId: string, value: Value) => Promise<void>;
};

export type BaseValuesConnectorImplementations = {
  connect?: (sync: (valueId: string) => Promise<void>) => Promise<void>;
  getUnderlyingValuesHash: () => Promise<Hash>;
  getUnderlyingValueIds: () => Promise<string[]>;
  getUnderlyingValue: (valueId: string) => Promise<Value>;
  getUnderlyingValueTimestamp: (valueId: string) => Promise<Timestamp>;
  setUnderlyingValuesHash: (hash: Hash) => Promise<void>;
  setUnderlyingValue: (valueId: string, value: Value) => Promise<void>;
  setUnderlyingValueTimestamp: (
    valueId: string,
    timestamp: Timestamp,
  ) => Promise<void>;
};

export type BaseTableConnectorImplementations = {
  connect?: (
    sync: (rowId?: string, cellId?: string) => Promise<void>,
  ) => Promise<void>;
  getTableHash?: () => Promise<Hash>;
  getRowIds?: () => Promise<string[]>;
  getRowHash?: (rowId: string) => Promise<Hash>;
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

export type BaseTablesConnectorImplementations = {
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

export function createBaseValuesConnector(
  implementations: BaseValuesConnectorImplementations,
  options?: ConnectorOptions,
): BaseValuesConnector;

export function createBaseTableConnector(
  implementations?: BaseTableConnectorImplementations,
  options?: ConnectorOptions,
): Connector;

export function createBaseTablesConnector(
  implementations?: BaseTablesConnectorImplementations,
  options?: ConnectorOptions,
): Connector;
