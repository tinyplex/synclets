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
    getTableHash,
    getRowIds,
    getRowHash,
    getCellIds,
    getCellAtom,
    getCellTimestamp,
    setTableHash,
    setRowHash,
    setCellAtom,
    setCellTimestamp,
  }: BaseTableConnectorImplementations,
  options?: ConnectorOptions,
): BaseTableConnector => {
  let underlyingSync:
    | ((rowId?: string, cellId?: string) => Promise<void>)
    | undefined;

  const connector = createConnector(
    {
      connect: async (sync: (address: Address) => Promise<void>) => {
        underlyingSync = (rowId, cellId) =>
          isUndefined(rowId)
            ? sync([])
            : isUndefined(cellId)
              ? sync([rowId])
              : sync([rowId, cellId]);
        await connect?.(underlyingSync);
      },

      disconnect: async () => {
        underlyingSync = undefined;
        await disconnect?.();
      },

      getAtom: ([rowId, cellId]: Address) => getCellAtom(rowId, cellId),

      getTimestamp: ([rowId, cellId]: Address) =>
        getCellTimestamp(rowId, cellId),

      getHash: ([rowId]: Address) =>
        isUndefined(rowId) ? getTableHash() : getRowHash(rowId),

      setAtom: ([rowId, cellId]: Address, value: Atom) =>
        setCellAtom(rowId, cellId, value),

      setTimestamp: ([rowId, cellId]: Address, timestamp: Timestamp) =>
        setCellTimestamp(rowId, cellId, timestamp),

      setHash: ([rowId]: Address, hash: number): Promise<void> =>
        isUndefined(rowId) ? setTableHash(hash) : setRowHash(rowId, hash),

      hasChildren: async (address: Address) => size(address) < 2,

      getChildren: async ([rowId, more]: Address) =>
        await (isUndefined(rowId)
          ? getRowIds()
          : isUndefined(more)
            ? getCellIds(rowId)
            : []),
    },
    options,
  );

  // --

  const getCell = getCellAtom;

  const setManagedCell = async (
    rowId: string,
    cellId: string,
    cell: Atom,
    context: Context,
  ) => {
    await connector.setManagedAtom([rowId, cellId], cell, context);
    await underlyingSync?.(rowId, cellId);
  };

  const delCell = async (_rowId: string, _cellId: string): Promise<void> => {};

  return {
    ...connector,
    getRowIds,
    getCellIds,
    getCell,
    setManagedCell,
    delCell,
  };
};
