import {createConnector} from '@synclets';
import type {
  Address,
  Atom,
  ConnectorOptions,
  Timestamp,
} from '@synclets/@types';
import type {
  BaseTableConnector,
  BaseTableConnectorImplementations,
  createBaseTableConnector as createBaseTableConnectorDecl,
} from '@synclets/@types/connector/base';
import {
  DELETED_VALUE,
  getTimestampHash,
  isUndefined,
  size,
} from '@synclets/utils';

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

  const setCell = async (rowId: string, cellId: string, cell: Atom) => {
    const timestamp = connector.getNextTimestamp();
    const hashChange =
      getTimestampHash(await getCellTimestamp(rowId, cellId)) ^
      getTimestampHash(timestamp);

    await setCellAtom(rowId, cellId, cell);
    await setCellTimestamp(rowId, cellId, timestamp);
    await setRowHash(
      rowId,
      (((await getRowHash(rowId)) ?? 0) ^ hashChange) >>> 0,
    );
    await setTableHash((((await getTableHash()) ?? 0) ^ hashChange) >>> 0);
    await underlyingSync?.(rowId, cellId);
  };

  const delCell = (rowId: string, cellId: string): Promise<void> =>
    setCellAtom(rowId, cellId, DELETED_VALUE);

  return {...connector, getRowIds, getCellIds, getCell, setCell, delCell};
};
