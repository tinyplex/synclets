/// connector/base

import type {
  Connector,
  ConnectorOptions,
  Hash,
  Timestamp,
  Value,
} from '../../index.d.ts';

export type BaseValueConnector = Connector & {
  getValue: () => Promise<Value | undefined>;
  setValue: (value: Value) => Promise<void>;
  delValue: () => Promise<void>;
};

export type BaseValueConnectorImplementations = {
  underlyingConnect?: (sync: () => Promise<void>) => Promise<void>;
  underlyingDisconnect?: () => Promise<void>;
  getUnderlyingValue: () => Promise<Value | undefined>;
  getUnderlyingValueTimestamp: () => Promise<Timestamp>;
  setUnderlyingValue: (value: Value) => Promise<void>;
  setUnderlyingValueTimestamp: (timestamp: Timestamp) => Promise<void>;
  delUnderlyingValue: () => Promise<void>;
};

export function createBaseValueConnector(
  implementations: BaseValueConnectorImplementations,
  options?: ConnectorOptions,
): BaseValueConnector;

export type BaseValuesConnector = Connector & {
  getValueIds: (valueId: string) => Promise<string[]>;
  getValue: (valueId: string) => Promise<Value | undefined>;
  setValue: (valueId: string, value: Value) => Promise<void>;
  delValue: (valueId: string) => Promise<void>;
};

export type BaseValuesConnectorImplementations = {
  underlyingConnect?: (
    sync: (valueId: string) => Promise<void>,
  ) => Promise<void>;
  underlyingDisconnect?: () => Promise<void>;
  getUnderlyingValuesHash: () => Promise<Hash>;
  getUnderlyingValueIds: () => Promise<string[]>;
  getUnderlyingValue: (valueId: string) => Promise<Value | undefined>;
  getUnderlyingValueTimestamp: (valueId: string) => Promise<Timestamp>;
  setUnderlyingValuesHash: (hash: Hash) => Promise<void>;
  setUnderlyingValue: (valueId: string, value: Value) => Promise<void>;
  setUnderlyingValueTimestamp: (
    valueId: string,
    timestamp: Timestamp,
  ) => Promise<void>;
};

export function createBaseValuesConnector(
  implementations: BaseValuesConnectorImplementations,
  options?: ConnectorOptions,
): BaseValuesConnector;

export type BaseTableConnector = Connector & {
  getRowIds: () => Promise<string[]>;
  getCellIds: (rowId: string) => Promise<string[]>;
  getCell: (rowId: string, cellId: string) => Promise<Value | undefined>;
  setCell: (rowId: string, cellId: string, cell: Value) => Promise<void>;
  delCell: (rowId: string, cellId: string) => Promise<void>;
};

export type BaseTableConnectorImplementations = {
  underlyingConnect?: (
    sync: (rowId: string, cellId: string) => Promise<void>,
  ) => Promise<void>;
  underlyingDisconnect?: () => Promise<void>;
  getUnderlyingTableHash: () => Promise<Hash>;
  getUnderlyingRowIds: () => Promise<string[]>;
  getUnderlyingRowHash: (rowId: string) => Promise<Hash>;
  getUnderlyingCellIds: (rowId: string) => Promise<string[]>;
  getUnderlyingCell: (
    rowId: string,
    cellId: string,
  ) => Promise<Value | undefined>;
  getUnderlyingCellTimestamp: (
    rowId: string,
    cellId: string,
  ) => Promise<Timestamp>;
  setUnderlyingTableHash: (hash: Hash) => Promise<void>;
  setUnderlyingRowHash: (rowId: string, hash: Hash) => Promise<void>;
  setUnderlyingCell: (
    rowId: string,
    cellId: string,
    value: Value,
  ) => Promise<void>;
  setUnderlyingCellTimestamp: (
    rowId: string,
    cellId: string,
    timestamp: Timestamp,
  ) => Promise<void>;
};

export function createBaseTableConnector(
  implementations: BaseTableConnectorImplementations,
  options?: ConnectorOptions,
): BaseTableConnector;

export type BaseTablesConnector = Connector & {
  getTableIds: () => Promise<string[]>;
  getRowIds: (tableId: string) => Promise<string[]>;
  getCellIds: (tableId: string, rowId: string) => Promise<string[]>;
  getCell: (
    tableId: string,
    rowId: string,
    cellId: string,
  ) => Promise<Value | undefined>;
  setCell: (
    tableId: string,
    rowId: string,
    cellId: string,
    cell: Value,
  ) => Promise<void>;
  delCell: (tableId: string, rowId: string, cellId: string) => Promise<void>;
};

export type BaseTablesConnectorImplementations = {
  underlyingConnect?: (
    sync: (tableId?: string, rowId?: string, cellId?: string) => Promise<void>,
  ) => Promise<void>;
  underlyingDisconnect?: () => Promise<void>;
  getUnderlyingTablesHash: () => Promise<Hash>;
  getUnderlyingTableIds: () => Promise<string[]>;
  getUnderlyingTableHash: (tableId: string) => Promise<Hash>;
  getUnderlyingRowIds: (tableId: string) => Promise<string[]>;
  getUnderlyingRowHash: (tableId: string, rowId: string) => Promise<Hash>;
  getUnderlyingCellIds: (tableId: string, rowId: string) => Promise<string[]>;
  getUnderlyingCell: (
    tableId: string,
    rowId: string,
    cellId: string,
  ) => Promise<Value | undefined>;
  getUnderlyingCellTimestamp: (
    tableId: string,
    rowId: string,
    cellId: string,
  ) => Promise<Timestamp>;
  setUnderlyingTablesHash: (hash: Hash) => Promise<void>;
  setUnderlyingTableHash: (tableId: string, hash: Hash) => Promise<void>;
  setUnderlyingRowHash: (
    tableId: string,
    rowId: string,
    hash: Hash,
  ) => Promise<void>;
  setUnderlyingCell: (
    tableId: string,
    rowId: string,
    cellId: string,
    value: Value,
  ) => Promise<void>;
  setUnderlyingCellTimestamp: (
    tableId: string,
    rowId: string,
    cellId: string,
    timestamp: Timestamp,
  ) => Promise<void>;
};

export function createBaseTablesConnector(
  implementations: BaseTablesConnectorImplementations,
  options?: ConnectorOptions,
): BaseTablesConnector;
