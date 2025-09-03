/// connector/base

import type {
  Atom,
  Connector,
  ConnectorOptions,
  Hash,
  Timestamp,
} from '../../index.d.ts';

export type BaseValueConnector = Connector & {
  getValue: () => Promise<Atom | undefined>;
  setValue: (atom: Atom) => Promise<void>;
  delValue: () => Promise<void>;
};

export type BaseValueConnectorImplementations = {
  underlyingConnect?: (sync: () => Promise<void>) => Promise<void>;
  underlyingDisconnect?: () => Promise<void>;
  getValueAtom: () => Promise<Atom | undefined>;
  getValueTimestamp: () => Promise<Timestamp | undefined>;
  setValueAtom: (atom: Atom) => Promise<void>;
  setValueTimestamp: (timestamp: Timestamp) => Promise<void>;
};

export function createBaseValueConnector(
  implementations: BaseValueConnectorImplementations,
  options?: ConnectorOptions,
): BaseValueConnector;

export type BaseValuesConnector = Connector & {
  getValueIds: () => Promise<string[]>;
  getValue: (valueId: string) => Promise<Atom | undefined>;
  setValue: (valueId: string, atom: Atom) => Promise<void>;
  delValue: (valueId: string) => Promise<void>;
};

export type BaseValuesConnectorImplementations = {
  underlyingConnect?: (
    sync: (valueId: string) => Promise<void>,
  ) => Promise<void>;
  underlyingDisconnect?: () => Promise<void>;
  getValuesHash: () => Promise<Hash | undefined>;
  getValueIds: () => Promise<string[]>;
  getValueAtom: (valueId: string) => Promise<Atom | undefined>;
  getValueTimestamp: (valueId: string) => Promise<Timestamp | undefined>;
  setValuesHash: (hash: Hash) => Promise<void>;
  setValueAtom: (valueId: string, atom: Atom) => Promise<void>;
  setValueTimestamp: (valueId: string, timestamp: Timestamp) => Promise<void>;
};

export function createBaseValuesConnector(
  implementations: BaseValuesConnectorImplementations,
  options?: ConnectorOptions,
): BaseValuesConnector;

export type BaseTableConnector = Connector & {
  getRowIds: () => Promise<string[]>;
  getCellIds: (rowId: string) => Promise<string[] | undefined>;
  getCell: (rowId: string, cellId: string) => Promise<Atom | undefined>;
  setCell: (rowId: string, cellId: string, cell: Atom) => Promise<void>;
  delCell: (rowId: string, cellId: string) => Promise<void>;
};

export type BaseTableConnectorImplementations = {
  underlyingConnect?: (
    sync: (rowId: string, cellId: string) => Promise<void>,
  ) => Promise<void>;
  underlyingDisconnect?: () => Promise<void>;
  getTableHash: () => Promise<Hash | undefined>;
  getRowIds: () => Promise<string[]>;
  getRowHash: (rowId: string) => Promise<Hash | undefined>;
  getCellIds: (rowId: string) => Promise<string[] | undefined>;
  getCellAtom: (rowId: string, cellId: string) => Promise<Atom | undefined>;
  getCellTimestamp: (
    rowId: string,
    cellId: string,
  ) => Promise<Timestamp | undefined>;
  setTableHash: (hash: Hash) => Promise<void>;
  setRowHash: (rowId: string, hash: Hash) => Promise<void>;
  setCellAtom: (rowId: string, cellId: string, atom: Atom) => Promise<void>;
  setCellTimestamp: (
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
  getRowIds: (tableId: string) => Promise<string[] | undefined>;
  getCellIds: (tableId: string, rowId: string) => Promise<string[] | undefined>;
  getCell: (
    tableId: string,
    rowId: string,
    cellId: string,
  ) => Promise<Atom | undefined>;
  setCell: (
    tableId: string,
    rowId: string,
    cellId: string,
    cell: Atom,
  ) => Promise<void>;
  delCell: (tableId: string, rowId: string, cellId: string) => Promise<void>;
};

export type BaseTablesConnectorImplementations = {
  underlyingConnect?: (
    sync: (tableId?: string, rowId?: string, cellId?: string) => Promise<void>,
  ) => Promise<void>;
  underlyingDisconnect?: () => Promise<void>;
  getTablesHash: () => Promise<Hash | undefined>;
  getTableIds: () => Promise<string[]>;
  getTableHash: (tableId: string) => Promise<Hash | undefined>;
  getRowIds: (tableId: string) => Promise<string[] | undefined>;
  getRowHash: (tableId: string, rowId: string) => Promise<Hash | undefined>;
  getCellIds: (tableId: string, rowId: string) => Promise<string[] | undefined>;
  getCellAtom: (
    tableId: string,
    rowId: string,
    cellId: string,
  ) => Promise<Atom | undefined>;
  getCellTimestamp: (
    tableId: string,
    rowId: string,
    cellId: string,
  ) => Promise<Timestamp | undefined>;
  setTablesHash: (hash: Hash) => Promise<void>;
  setTableHash: (tableId: string, hash: Hash) => Promise<void>;
  setRowHash: (tableId: string, rowId: string, hash: Hash) => Promise<void>;
  setCellAtom: (
    tableId: string,
    rowId: string,
    cellId: string,
    atom: Atom,
  ) => Promise<void>;
  setCellTimestamp: (
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
