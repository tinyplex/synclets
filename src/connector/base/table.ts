import {createConnector} from '@synclets';
import type {
  Address,
  Atom,
  ConnectorOptions,
  Context,
  Timestamp,
} from '@synclets/@types';
import type {
  BaseTableConnector,
  BaseTableConnectorImplementations,
  createBaseTableConnector as createBaseTableConnectorDecl,
} from '@synclets/@types/connector/base';
import {isUndefined, size} from '@synclets/utils';

export const createBaseTableConnector: typeof createBaseTableConnectorDecl = (
  {
    connect,
    disconnect,
    readTableHash,
    readRowIds,
    readRowHash,
    readCellIds,
    readCellAtom,
    readCellTimestamp,
    writeTableHash,
    writeRowHash,
    writeCellAtom,
    writeCellTimestamp,
    removeCellAtom,
  }: BaseTableConnectorImplementations,
  options?: ConnectorOptions,
): BaseTableConnector => {
  let underlyingSync:
    | ((rowId?: string, cellId?: string) => Promise<void>)
    | undefined;

  const connector = createConnector(
    {
      connect: async (sync?: (address: Address) => Promise<void>) => {
        underlyingSync = sync
          ? (rowId, cellId) =>
              isUndefined(rowId)
                ? sync([])
                : isUndefined(cellId)
                  ? sync([rowId])
                  : sync([rowId, cellId])
          : undefined;
        await connect?.(underlyingSync);
      },

      disconnect: async () => {
        underlyingSync = undefined;
        await disconnect?.();
      },

      readAtom: ([rowId, cellId]: Address, context: Context) =>
        readCellAtom(rowId, cellId, context),

      readTimestamp: ([rowId, cellId]: Address, context: Context) =>
        readCellTimestamp(rowId, cellId, context),

      readHash: ([rowId]: Address, context: Context) =>
        isUndefined(rowId)
          ? readTableHash(context)
          : readRowHash(rowId, context),

      writeAtom: ([rowId, cellId]: Address, value: Atom, context: Context) =>
        writeCellAtom(rowId, cellId, value, context),

      writeTimestamp: (
        [rowId, cellId]: Address,
        timestamp: Timestamp,
        context: Context,
      ) => writeCellTimestamp(rowId, cellId, timestamp, context),

      writeHash: (
        [rowId]: Address,
        hash: number,
        context: Context,
      ): Promise<void> =>
        isUndefined(rowId)
          ? writeTableHash(hash, context)
          : writeRowHash(rowId, hash, context),

      removeAtom: ([rowId, cellId]: Address, context: Context) =>
        removeCellAtom(rowId, cellId, context),

      isParent: async (address: Address) => size(address) < 2,

      readChildIds: async ([rowId, more]: Address, context: Context) =>
        await (isUndefined(rowId)
          ? readRowIds(context)
          : isUndefined(more)
            ? readCellIds(rowId, context)
            : []),
    },
    options,
  );

  // --

  return {
    ...connector,

    getRowIds: (context: Context = {}) => readRowIds(context),

    getCellIds: (rowId: string, context: Context = {}) =>
      readCellIds(rowId, context),

    getCell: (rowId: string, cellId: string, context: Context = {}) =>
      readCellAtom(rowId, cellId, context),

    setCell: async (
      rowId: string,
      cellId: string,
      cell: Atom,
      context: Context = {},
    ) => {
      await connector.setAtom([rowId, cellId], cell, context);
      await underlyingSync?.(rowId, cellId);
    },

    delCell: async (
      rowId: string,
      cellId: string,
      context: Context = {},
    ): Promise<void> => {
      await connector.delAtom([rowId, cellId], context);
      await underlyingSync?.(rowId, cellId);
    },
  };
};
