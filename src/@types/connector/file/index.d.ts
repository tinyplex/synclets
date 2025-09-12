/// connector/file

import type {ConnectorOptions} from '../../index.d.ts';
import type {BaseValueConnector} from '../base/index.d.ts';

export type FileValueConnector = BaseValueConnector & {
  getDirectory: () => string;
};

export function createFileValueConnector(
  directory: string,
  options?: ConnectorOptions,
): Promise<FileValueConnector>;

// export type FileValuesConnector = Connector & {
//   getValueIds: (context?: Context) => Promise<string[]>;
//   getValue: (valueId: string, context?: Context) => Promise<Atom |
//  undefined>;
//   setValue: (
//     valueId: string,
//     value: Atom,
//     context?: Context,
//     sync?: boolean,
//   ) => Promise<void>;
//   delValue: (
//     valueId: string,
//     context?: Context,
//     sync?: boolean,
//   ) => Promise<void>;
// };

// export type FileValuesConnectorImplementations = {
//   connect?: () => Promise<void>;
//   disconnect?: () => Promise<void>;
//   readValuesHash: (context: Context) => Promise<Hash | undefined>;
//   readValueIds: (context: Context) => Promise<string[]>;
//   readValueAtom: (
//     valueId: string,
//     context: Context,
//   ) => Promise<Atom | undefined>;
//   readValueTimestamp: (
//     valueId: string,
//     context: Context,
//   ) => Promise<Timestamp | undefined>;
//   writeValuesHash: (hash: Hash, context: Context) => Promise<void>;
//   writeValueAtom: (
//     valueId: string,
//     atom: Atom,
//     context: Context,
//   ) => Promise<void>;
//   writeValueTimestamp: (
//     valueId: string,
//     timestamp: Timestamp,
//     context: Context,
//   ) => Promise<void>;
//   removeValueAtom: (valueId: string, context: Context) => Promise<void>;
// };

// export function createFileValuesConnector(
//   implementations: FileValuesConnectorImplementations,
//   options?: ConnectorOptions,
// ): FileValuesConnector;

// export type FileTableConnector = Connector & {
//   getRowIds: (context?: Context) => Promise<string[]>;
//   getCellIds: (
//     rowId: string,
//     context?: Context,
//   ) => Promise<string[] | undefined>;
//   getCell: (
//     rowId: string,
//     cellId: string,
//     context?: Context,
//   ) => Promise<Atom | undefined>;
//   setCell: (
//     rowId: string,
//     cellId: string,
//     cell: Atom,
//     context?: Context,
//     sync?: boolean,
//   ) => Promise<void>;
//   delCell: (
//     rowId: string,
//     cellId: string,
//     context?: Context,
//     sync?: boolean,
//   ) => Promise<void>;
// };

// export type FileTableConnectorImplementations = {
//   connect?: (
//
//   ) => Promise<void>;
//   disconnect?: () => Promise<void>;
//   readTableHash: (context: Context) => Promise<Hash | undefined>;
//   readRowIds: (context: Context) => Promise<string[]>;
//   readRowHash: (rowId: string, context: Context) => Promise<Hash |
// undefined>;
//   readCellIds: (
//     rowId: string,
//     context: Context,
//   ) => Promise<string[] | undefined>;
//   readCellAtom: (
//     rowId: string,
//     cellId: string,
//     context: Context,
//   ) => Promise<Atom | undefined>;
//   readCellTimestamp: (
//     rowId: string,
//     cellId: string,
//     context: Context,
//   ) => Promise<Timestamp | undefined>;
//   writeTableHash: (hash: Hash, context: Context) => Promise<void>;
//   writeRowHash: (rowId: string, hash: Hash, context: Context) =>
//  Promise<void>;
//   writeCellAtom: (
//     rowId: string,
//     cellId: string,
//     atom: Atom,
//     context: Context,
//   ) => Promise<void>;
//   writeCellTimestamp: (
//     rowId: string,
//     cellId: string,
//     timestamp: Timestamp,
//     context: Context,
//   ) => Promise<void>;
//   removeCellAtom: (
//     rowId: string,
//     cellId: string,
//     context: Context,
//   ) => Promise<void>;
// };

// export function createFileTableConnector(
//   implementations: FileTableConnectorImplementations,
//   options?: ConnectorOptions,
// ): FileTableConnector;

// export type FileTablesConnector = Connector & {
//   getTableIds: (context?: Context) => Promise<string[]>;
//   getRowIds: (
//     tableId: string,
//     context?: Context,
//   ) => Promise<string[] | undefined>;
//   getCellIds: (
//     tableId: string,
//     rowId: string,
//     context?: Context,
//   ) => Promise<string[] | undefined>;
//   getCell: (
//     tableId: string,
//     rowId: string,
//     cellId: string,
//     context?: Context,
//   ) => Promise<Atom | undefined>;
//   setCell: (
//     tableId: string,
//     rowId: string,
//     cellId: string,
//     cell: Atom,
//     context?: Context,
//     sync?: boolean,
//   ) => Promise<void>;
//   delCell: (
//     tableId: string,
//     rowId: string,
//     cellId: string,
//     context?: Context,
//     sync?: boolean,
//   ) => Promise<void>;
// };

// export type FileTablesConnectorImplementations = {
//   connect?: (
//
//   ) => Promise<void>;
//   disconnect?: () => Promise<void>;
//   readTablesHash: (context: Context) => Promise<Hash | undefined>;
//   readTableIds: (context: Context) => Promise<string[]>;
//   readTableHash: (
//     tableId: string,
//     context: Context,
//   ) => Promise<Hash | undefined>;
//   readRowIds: (
//     tableId: string,
//     context: Context,
//   ) => Promise<string[] | undefined>;
//   readRowHash: (
//     tableId: string,
//     rowId: string,
//     context: Context,
//   ) => Promise<Hash | undefined>;
//   readCellIds: (
//     tableId: string,
//     rowId: string,
//     context: Context,
//   ) => Promise<string[] | undefined>;
//   readCellAtom: (
//     tableId: string,
//     rowId: string,
//     cellId: string,
//     context: Context,
//   ) => Promise<Atom | undefined>;
//   readCellTimestamp: (
//     tableId: string,
//     rowId: string,
//     cellId: string,
//     context: Context,
//   ) => Promise<Timestamp | undefined>;
//   writeTablesHash: (hash: Hash, context: Context) => Promise<void>;
//   writeTableHash: (
//     tableId: string,
//     hash: Hash,
//     context: Context,
//   ) => Promise<void>;
//   writeRowHash: (
//     tableId: string,
//     rowId: string,
//     hash: Hash,
//     context: Context,
//   ) => Promise<void>;
//   writeCellAtom: (
//     tableId: string,
//     rowId: string,
//     cellId: string,
//     atom: Atom,
//     context: Context,
//   ) => Promise<void>;
//   writeCellTimestamp: (
//     tableId: string,
//     rowId: string,
//     cellId: string,
//     timestamp: Timestamp,
//     context: Context,
//   ) => Promise<void>;
//   removeCellAtom: (
//     tableId: string,
//     rowId: string,
//     cellId: string,
//     context: Context,
//   ) => Promise<void>;
// };

// export function createFileTablesConnector(
//   implementations: FileTablesConnectorImplementations,
//   options?: ConnectorOptions,
// ): FileTablesConnector;
