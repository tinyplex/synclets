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
import {isUndefined} from '@synclets/utils';

export const createBaseTableConnector: typeof createBaseTableConnectorDecl =
  async (
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
  ): Promise<BaseTableConnector> => {
    const connector = await createConnector(
      2,
      {
        connect,

        disconnect,

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

      setCell: (
        rowId: string,
        cellId: string,
        cell: Atom,
        context: Context = {},
        sync?: boolean,
      ) => connector.setAtom([rowId, cellId], cell, context, sync),

      delCell: (
        rowId: string,
        cellId: string,
        context: Context = {},
        sync?: boolean,
      ): Promise<void> => connector.delAtom([rowId, cellId], context, sync),
    };
  };
