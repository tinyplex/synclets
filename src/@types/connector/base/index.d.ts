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
  getValue: (context?: Context) => Promise<Atom | undefined>;
  setValue: (value: Atom, context?: Context, sync?: boolean) => Promise<void>;
  delValue: (context?: Context, sync?: boolean) => Promise<void>;
};

export type BaseValueConnectorImplementations = {
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  readValueAtom: (context: Context) => Promise<Atom | undefined>;
  readValueTimestamp: (context: Context) => Promise<Timestamp | undefined>;
  writeValueAtom: (atom: Atom, context: Context) => Promise<void>;
  writeValueTimestamp: (
    timestamp: Timestamp,
    context: Context,
  ) => Promise<void>;
  removeValueAtom: (context: Context) => Promise<void>;
};

export function createBaseValueConnector(
  implementations: BaseValueConnectorImplementations,
  options?: ConnectorOptions,
): Promise<BaseValueConnector>;

export type BaseValuesConnector = Connector & {
  getValueIds: (context?: Context) => Promise<string[]>;
  getValue: (valueId: string, context?: Context) => Promise<Atom | undefined>;
  setValue: (
    valueId: string,
    value: Atom,
    context?: Context,
    sync?: boolean,
  ) => Promise<void>;
  delValue: (
    valueId: string,
    context?: Context,
    sync?: boolean,
  ) => Promise<void>;
};

export type BaseValuesConnectorImplementations = {
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  readValuesHash: (context: Context) => Promise<Hash | undefined>;
  readValueIds: (context: Context) => Promise<string[]>;
  readValueAtom: (
    valueId: string,
    context: Context,
  ) => Promise<Atom | undefined>;
  readValueTimestamp: (
    valueId: string,
    context: Context,
  ) => Promise<Timestamp | undefined>;
  writeValuesHash: (hash: Hash, context: Context) => Promise<void>;
  writeValueAtom: (
    valueId: string,
    atom: Atom,
    context: Context,
  ) => Promise<void>;
  writeValueTimestamp: (
    valueId: string,
    timestamp: Timestamp,
    context: Context,
  ) => Promise<void>;
  removeValueAtom: (valueId: string, context: Context) => Promise<void>;
};

export function createBaseValuesConnector(
  implementations: BaseValuesConnectorImplementations,
  options?: ConnectorOptions,
): Promise<BaseValuesConnector>;

export type BaseTableConnector = Connector & {
  getRowIds: (context?: Context) => Promise<string[]>;
  getCellIds: (
    rowId: string,
    context?: Context,
  ) => Promise<string[] | undefined>;
  getCell: (
    rowId: string,
    cellId: string,
    context?: Context,
  ) => Promise<Atom | undefined>;
  setCell: (
    rowId: string,
    cellId: string,
    cell: Atom,
    context?: Context,
    sync?: boolean,
  ) => Promise<void>;
  delCell: (
    rowId: string,
    cellId: string,
    context?: Context,
    sync?: boolean,
  ) => Promise<void>;
};

export type BaseTableConnectorImplementations = {
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  readTableHash: (context: Context) => Promise<Hash | undefined>;
  readRowIds: (context: Context) => Promise<string[]>;
  readRowHash: (rowId: string, context: Context) => Promise<Hash | undefined>;
  readCellIds: (
    rowId: string,
    context: Context,
  ) => Promise<string[] | undefined>;
  readCellAtom: (
    rowId: string,
    cellId: string,
    context: Context,
  ) => Promise<Atom | undefined>;
  readCellTimestamp: (
    rowId: string,
    cellId: string,
    context: Context,
  ) => Promise<Timestamp | undefined>;
  writeTableHash: (hash: Hash, context: Context) => Promise<void>;
  writeRowHash: (rowId: string, hash: Hash, context: Context) => Promise<void>;
  writeCellAtom: (
    rowId: string,
    cellId: string,
    atom: Atom,
    context: Context,
  ) => Promise<void>;
  writeCellTimestamp: (
    rowId: string,
    cellId: string,
    timestamp: Timestamp,
    context: Context,
  ) => Promise<void>;
  removeCellAtom: (
    rowId: string,
    cellId: string,
    context: Context,
  ) => Promise<void>;
};

export function createBaseTableConnector(
  implementations: BaseTableConnectorImplementations,
  options?: ConnectorOptions,
): Promise<BaseTableConnector>;

export type BaseTablesConnector = Connector & {
  getTableIds: (context?: Context) => Promise<string[]>;
  getRowIds: (
    tableId: string,
    context?: Context,
  ) => Promise<string[] | undefined>;
  getCellIds: (
    tableId: string,
    rowId: string,
    context?: Context,
  ) => Promise<string[] | undefined>;
  getCell: (
    tableId: string,
    rowId: string,
    cellId: string,
    context?: Context,
  ) => Promise<Atom | undefined>;
  setCell: (
    tableId: string,
    rowId: string,
    cellId: string,
    cell: Atom,
    context?: Context,
    sync?: boolean,
  ) => Promise<void>;
  delCell: (
    tableId: string,
    rowId: string,
    cellId: string,
    context?: Context,
    sync?: boolean,
  ) => Promise<void>;
};

export type BaseTablesConnectorImplementations = {
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  readTablesHash: (context: Context) => Promise<Hash | undefined>;
  readTableIds: (context: Context) => Promise<string[]>;
  readTableHash: (
    tableId: string,
    context: Context,
  ) => Promise<Hash | undefined>;
  readRowIds: (
    tableId: string,
    context: Context,
  ) => Promise<string[] | undefined>;
  readRowHash: (
    tableId: string,
    rowId: string,
    context: Context,
  ) => Promise<Hash | undefined>;
  readCellIds: (
    tableId: string,
    rowId: string,
    context: Context,
  ) => Promise<string[] | undefined>;
  readCellAtom: (
    tableId: string,
    rowId: string,
    cellId: string,
    context: Context,
  ) => Promise<Atom | undefined>;
  readCellTimestamp: (
    tableId: string,
    rowId: string,
    cellId: string,
    context: Context,
  ) => Promise<Timestamp | undefined>;
  writeTablesHash: (hash: Hash, context: Context) => Promise<void>;
  writeTableHash: (
    tableId: string,
    hash: Hash,
    context: Context,
  ) => Promise<void>;
  writeRowHash: (
    tableId: string,
    rowId: string,
    hash: Hash,
    context: Context,
  ) => Promise<void>;
  writeCellAtom: (
    tableId: string,
    rowId: string,
    cellId: string,
    atom: Atom,
    context: Context,
  ) => Promise<void>;
  writeCellTimestamp: (
    tableId: string,
    rowId: string,
    cellId: string,
    timestamp: Timestamp,
    context: Context,
  ) => Promise<void>;
  removeCellAtom: (
    tableId: string,
    rowId: string,
    cellId: string,
    context: Context,
  ) => Promise<void>;
};

export function createBaseTablesConnector(
  implementations: BaseTablesConnectorImplementations,
  options?: ConnectorOptions,
): Promise<BaseTablesConnector>;
