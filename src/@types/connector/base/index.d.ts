/// connector/base

import type {
  Atom,
  Connector,
  ConnectorOptions,
  Context,
  Hash,
  Timestamp,
} from '../../index.d.ts';

export type BaseValueConnector = Connector & {
  getValue: () => Promise<Atom | undefined>;
  setValue: (value: Atom, context: Context) => Promise<void>;
  delValue: () => Promise<void>;
};

export type BaseValueConnectorImplementations = {
  connect?: (sync?: () => Promise<void>) => Promise<void>;
  disconnect?: () => Promise<void>;
  readValueAtom: () => Promise<Atom | undefined>;
  readValueIsDeleted: () => Promise<boolean | undefined>;
  readValueTimestamp: () => Promise<Timestamp | undefined>;
  writeValueAtom: (atom: Atom) => Promise<void>;
  writeValueTimestamp: (timestamp: Timestamp) => Promise<void>;
};

export function createBaseValueConnector(
  implementations: BaseValueConnectorImplementations,
  options?: ConnectorOptions,
): BaseValueConnector;

export type BaseValuesConnector = Connector & {
  getValueIds: () => Promise<string[]>;
  getValue: (valueId: string) => Promise<Atom | undefined>;
  setValue: (valueId: string, value: Atom, context: Context) => Promise<void>;
  delValue: (valueId: string) => Promise<void>;
};

export type BaseValuesConnectorImplementations = {
  connect?: (sync?: (valueId: string) => Promise<void>) => Promise<void>;
  disconnect?: () => Promise<void>;
  readValuesHash: () => Promise<Hash | undefined>;
  readValueIds: () => Promise<string[]>;
  readDeletedValueIds: () => Promise<string[]>;
  readValueAtom: (valueId: string) => Promise<Atom | undefined>;
  readValueIsDeleted: (valueId: string) => Promise<boolean | undefined>;
  readValueTimestamp: (valueId: string) => Promise<Timestamp | undefined>;
  writeValuesHash: (hash: Hash) => Promise<void>;
  writeValueAtom: (valueId: string, atom: Atom) => Promise<void>;
  writeValueTimestamp: (valueId: string, timestamp: Timestamp) => Promise<void>;
};

export function createBaseValuesConnector(
  implementations: BaseValuesConnectorImplementations,
  options?: ConnectorOptions,
): BaseValuesConnector;

export type BaseTableConnector = Connector & {
  getRowIds: () => Promise<string[]>;
  getCellIds: (rowId: string) => Promise<string[] | undefined>;
  getCell: (rowId: string, cellId: string) => Promise<Atom | undefined>;
  setCell: (
    rowId: string,
    cellId: string,
    cell: Atom,
    context: Context,
  ) => Promise<void>;
  delCell: (rowId: string, cellId: string) => Promise<void>;
};

export type BaseTableConnectorImplementations = {
  connect?: (
    sync?: (rowId: string, cellId: string) => Promise<void>,
  ) => Promise<void>;
  disconnect?: () => Promise<void>;
  readTableHash: () => Promise<Hash | undefined>;
  readRowIds: () => Promise<string[]>;
  readDeletedRowIds: () => Promise<string[]>;
  readRowHash: (rowId: string) => Promise<Hash | undefined>;
  readCellIds: (rowId: string) => Promise<string[] | undefined>;
  readDeletedCellIds: (rowId: string) => Promise<string[] | undefined>;
  readCellAtom: (rowId: string, cellId: string) => Promise<Atom | undefined>;
  readCellIsDeleted: (
    rowId: string,
    cellId: string,
  ) => Promise<boolean | undefined>;
  readCellTimestamp: (
    rowId: string,
    cellId: string,
  ) => Promise<Timestamp | undefined>;
  writeTableHash: (hash: Hash) => Promise<void>;
  writeRowHash: (rowId: string, hash: Hash) => Promise<void>;
  writeCellAtom: (rowId: string, cellId: string, atom: Atom) => Promise<void>;
  writeCellTimestamp: (
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
    context: Context,
  ) => Promise<void>;
  delCell: (tableId: string, rowId: string, cellId: string) => Promise<void>;
};

export type BaseTablesConnectorImplementations = {
  connect?: (
    sync?: (tableId?: string, rowId?: string, cellId?: string) => Promise<void>,
  ) => Promise<void>;
  disconnect?: () => Promise<void>;
  readTablesHash: () => Promise<Hash | undefined>;
  readTableIds: () => Promise<string[]>;
  readDeletedTableIds: () => Promise<string[]>;
  readTableHash: (tableId: string) => Promise<Hash | undefined>;
  readRowIds: (tableId: string) => Promise<string[] | undefined>;
  readDeletedRowIds: (tableId: string) => Promise<string[] | undefined>;
  readRowHash: (tableId: string, rowId: string) => Promise<Hash | undefined>;
  readCellIds: (
    tableId: string,
    rowId: string,
  ) => Promise<string[] | undefined>;
  readDeletedCellIds: (
    tableId: string,
    rowId: string,
  ) => Promise<string[] | undefined>;
  readCellAtom: (
    tableId: string,
    rowId: string,
    cellId: string,
  ) => Promise<Atom | undefined>;
  readCellIsDeleted: (
    tableId: string,
    rowId: string,
    cellId: string,
  ) => Promise<boolean | undefined>;
  readCellTimestamp: (
    tableId: string,
    rowId: string,
    cellId: string,
  ) => Promise<Timestamp | undefined>;
  writeTablesHash: (hash: Hash) => Promise<void>;
  writeTableHash: (tableId: string, hash: Hash) => Promise<void>;
  writeRowHash: (tableId: string, rowId: string, hash: Hash) => Promise<void>;
  writeCellAtom: (
    tableId: string,
    rowId: string,
    cellId: string,
    atom: Atom,
  ) => Promise<void>;
  writeCellTimestamp: (
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
