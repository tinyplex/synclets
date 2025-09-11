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
    removeCellAtom,
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

      readAtom: ([tableId, rowId, cellId]: Address, context: Context) =>
        readCellAtom(tableId, rowId, cellId, context),

      readTimestamp: ([tableId, rowId, cellId]: Address, context: Context) =>
        readCellTimestamp(tableId, rowId, cellId, context),

      readHash: ([tableId, rowId]: Address, context: Context) =>
        isUndefined(tableId)
          ? readTablesHash(context)
          : isUndefined(rowId)
            ? readTableHash(tableId, context)
            : readRowHash(tableId, rowId, context),

      writeAtom: (
        [tableId, rowId, cellId]: Address,
        value: Atom,
        context: Context,
      ) => writeCellAtom(tableId, rowId, cellId, value, context),

      writeTimestamp: (
        [tableId, rowId, cellId]: Address,
        timestamp: Timestamp,
        context: Context,
      ) => writeCellTimestamp(tableId, rowId, cellId, timestamp, context),

      writeHash: ([tableId, rowId]: Address, hash: number, context: Context) =>
        isUndefined(tableId)
          ? writeTablesHash(hash, context)
          : isUndefined(rowId)
            ? writeTableHash(tableId, hash, context)
            : writeRowHash(tableId, rowId, hash, context),

      removeAtom: ([tableId, rowId, cellId]: Address, context: Context) =>
        removeCellAtom(tableId, rowId, cellId, context),

      isParent: async (address: Address) => size(address) < 3,

      readChildIds: async ([tableId, rowId, more]: Address, context: Context) =>
        await (isUndefined(tableId)
          ? readTableIds(context)
          : isUndefined(rowId)
            ? readRowIds(tableId, context)
            : isUndefined(more)
              ? readCellIds(tableId, rowId, context)
              : []),
    },
    options,
  );

  // --

  return {
    ...connector,

    getTableIds: (context: Context = {}) => readTableIds(context),

    getRowIds: (tableId: string, context: Context = {}) =>
      readRowIds(tableId, context),

    getCellIds: (tableId: string, rowId: string, context: Context = {}) =>
      readCellIds(tableId, rowId, context),

    getCell: (
      tableId: string,
      rowId: string,
      cellId: string,
      context: Context = {},
    ) => readCellAtom(tableId, rowId, cellId, context),

    setCell: (
      tableId: string,
      rowId: string,
      cellId: string,
      cell: Atom,
      context: Context = {},
      sync?: boolean,
    ) => connector.setAtom([tableId, rowId, cellId], cell, context, sync),

    delCell: (
      tableId: string,
      rowId: string,
      cellId: string,
      context: Context = {},
      sync?: boolean,
    ): Promise<void> =>
      connector.delAtom([tableId, rowId, cellId], context, sync),
  };
};
