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
    readTablesHash,
    readTableIds,
    readTableHash,
    readRowIds,
    readRowHash,
    readCellIds,
    readCellAtom,
    readCellTimestamp,
    writeTablesHash,
    writeTableHash,
    writeRowHash,
    writeCellAtom,
    writeCellTimestamp,
  }: BaseTablesConnectorImplementations,
  options?: ConnectorOptions,
): BaseTablesConnector => {
  let underlyingSync:
    | ((tableId?: string, rowId?: string, cellId?: string) => Promise<void>)
    | undefined;

  const connector = createConnector(
    {
      connect: async (sync?: (address: Address) => Promise<void>) => {
        underlyingSync = sync
          ? (tableId, rowId, cellId) =>
              isUndefined(tableId)
                ? sync([])
                : isUndefined(rowId)
                  ? sync([tableId])
                  : isUndefined(cellId)
                    ? sync([tableId, rowId])
                    : sync([tableId, rowId, cellId])
          : undefined;
        await connect?.(underlyingSync);
      },

      disconnect: async () => {
        underlyingSync = undefined;
        await disconnect?.();
      },

      readAtom: ([tableId, rowId, cellId]: Address) =>
        readCellAtom(tableId, rowId, cellId),

      readTimestamp: ([tableId, rowId, cellId]: Address) =>
        readCellTimestamp(tableId, rowId, cellId),

      readHash: ([tableId, rowId]: Address) =>
        isUndefined(tableId)
          ? readTablesHash()
          : isUndefined(rowId)
            ? readTableHash(tableId)
            : readRowHash(tableId, rowId),

      writeAtom: ([tableId, rowId, cellId]: Address, value: Atom) =>
        writeCellAtom(tableId, rowId, cellId, value),

      writeTimestamp: (
        [tableId, rowId, cellId]: Address,
        timestamp: Timestamp,
      ) => writeCellTimestamp(tableId, rowId, cellId, timestamp),

      writeHash: ([tableId, rowId]: Address, hash: number) =>
        isUndefined(tableId)
          ? writeTablesHash(hash)
          : isUndefined(rowId)
            ? writeTableHash(tableId, hash)
            : writeRowHash(tableId, rowId, hash),

      isParent: async (address: Address) => size(address) < 3,

      readChildIds: async ([tableId, rowId, more]: Address) =>
        await (isUndefined(tableId)
          ? readTableIds()
          : isUndefined(rowId)
            ? readRowIds(tableId)
            : isUndefined(more)
              ? readCellIds(tableId, rowId)
              : []),
    },
    options,
  );

  // --

  return {
    ...connector,
    getTableIds: readTableIds,
    getRowIds: readRowIds,
    getCellIds: readCellIds,
    getCell: readCellAtom,

    setCell: async (
      tableId: string,
      rowId: string,
      cellId: string,
      cell: Atom,
      context: Context,
    ) => {
      await connector.setAtom([tableId, rowId, cellId], cell, context);
      await underlyingSync?.(tableId, rowId, cellId);
    },

    delCell: async (
      _tableId: string,
      _rowId: string,
      _cellId: string,
    ): Promise<void> => {},
  };
};
