import {createConnector} from '@synclets';
import type {
  Address,
  Atom,
  ConnectorOptions,
  Context,
  Timestamp,
} from '@synclets/@types';
import type {
  BaseTablesConnector,
  BaseTablesConnectorImplementations,
  createBaseTablesConnector as createBaseTablesConnectorDecl,
} from '@synclets/@types/connector/base';
import {isUndefined, size} from '@synclets/utils';

export const createBaseTablesConnector: typeof createBaseTablesConnectorDecl = (
  {
    connect,
    disconnect,
    getTablesHash,
    getTableIds,
    getTableHash,
    getRowIds,
    getRowHash,
    getCellIds,
    getCellAtom,
    getCellTimestamp,
    setTablesHash,
    setTableHash,
    setRowHash,
    setCellAtom,
    setCellTimestamp,
  }: BaseTablesConnectorImplementations,
  options?: ConnectorOptions,
): BaseTablesConnector => {
  let underlyingSync:
    | ((tableId?: string, rowId?: string, cellId?: string) => Promise<void>)
    | undefined;

  const connector = createConnector(
    {
      connect: async (sync: (address: Address) => Promise<void>) => {
        underlyingSync = (tableId, rowId, cellId) =>
          isUndefined(tableId)
            ? sync([])
            : isUndefined(rowId)
              ? sync([tableId])
              : isUndefined(cellId)
                ? sync([tableId, rowId])
                : sync([tableId, rowId, cellId]);
        await connect?.(underlyingSync);
      },

      disconnect: async () => {
        underlyingSync = undefined;
        await disconnect?.();
      },

      getAtom: ([tableId, rowId, cellId]: Address) =>
        getCell(tableId, rowId, cellId),

      getTimestamp: ([tableId, rowId, cellId]: Address) =>
        getCellTimestamp(tableId, rowId, cellId),

      getHash: ([tableId, rowId]: Address) =>
        isUndefined(tableId)
          ? getTablesHash()
          : isUndefined(rowId)
            ? getTableHash(tableId)
            : getRowHash(tableId, rowId),

      setAtom: ([tableId, rowId, cellId]: Address, value: Atom) =>
        setCellAtom(tableId, rowId, cellId, value),

      setTimestamp: ([tableId, rowId, cellId]: Address, timestamp: Timestamp) =>
        setCellTimestamp(tableId, rowId, cellId, timestamp),

      setHash: ([tableId, rowId]: Address, hash: number) =>
        isUndefined(tableId)
          ? setTablesHash(hash)
          : isUndefined(rowId)
            ? setTableHash(tableId, hash)
            : setRowHash(tableId, rowId, hash),

      hasChildren: async (address: Address) => size(address) < 3,

      getChildren: async ([tableId, rowId, more]: Address) =>
        await (isUndefined(tableId)
          ? getTableIds()
          : isUndefined(rowId)
            ? getRowIds(tableId)
            : isUndefined(more)
              ? getCellIds(tableId, rowId)
              : []),
    },
    options,
  );

  // --

  const getCell = getCellAtom;

  const setManagedCell = async (
    tableId: string,
    rowId: string,
    cellId: string,
    cell: Atom,
    context: Context,
  ) => {
    await connector.setManagedAtom([tableId, rowId, cellId], cell, context);
    await underlyingSync?.(tableId, rowId, cellId);
  };

  const delCell = async (
    _tableId: string,
    _rowId: string,
    _cellId: string,
  ): Promise<void> => {};

  return {
    ...connector,
    getTableIds,
    getRowIds,
    getCellIds,
    getCell,
    setManagedCell,
    delCell,
  };
};
