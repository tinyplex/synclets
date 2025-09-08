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
    readDeletedRowIds,
    readRowHash,
    readCellIds,
    readDeletedCellIds,
    readCellAtom,
    readCellTimestamp,
    writeTableHash,
    writeRowHash,
    writeCellAtom,
    writeCellTimestamp,
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

      readAtom: ([rowId, cellId]: Address) => readCellAtom(rowId, cellId),

      readTimestamp: ([rowId, cellId]: Address) =>
        readCellTimestamp(rowId, cellId),

      readHash: ([rowId]: Address) =>
        isUndefined(rowId) ? readTableHash() : readRowHash(rowId),

      writeAtom: ([rowId, cellId]: Address, value: Atom) =>
        writeCellAtom(rowId, cellId, value),

      writeTimestamp: ([rowId, cellId]: Address, timestamp: Timestamp) =>
        writeCellTimestamp(rowId, cellId, timestamp),

      writeHash: ([rowId]: Address, hash: number): Promise<void> =>
        isUndefined(rowId) ? writeTableHash(hash) : writeRowHash(rowId, hash),

      isParent: async (address: Address) => size(address) < 2,

      readAtomIds: async ([rowId, more]: Address) =>
        await (isUndefined(rowId)
          ? readRowIds()
          : isUndefined(more)
            ? readCellIds(rowId)
            : []),

      readDeletedAtomIds: async ([rowId, more]: Address) =>
        await (isUndefined(rowId)
          ? readDeletedRowIds()
          : isUndefined(more)
            ? readDeletedCellIds(rowId)
            : []),
    },
    options,
  );

  // --

  return {
    ...connector,
    getRowIds: readRowIds,
    getCellIds: readCellIds,
    getCell: readCellAtom,

    setCell: async (
      rowId: string,
      cellId: string,
      cell: Atom,
      context: Context,
    ) => {
      await connector.setAtom([rowId, cellId], cell, context);
      await underlyingSync?.(rowId, cellId);
    },

    delCell: async (_rowId: string, _cellId: string): Promise<void> => {},
  };
};
