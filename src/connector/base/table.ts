import {createConnector} from '@synclets';
import type {
  Address,
  ConnectorOptions,
  Timestamp,
  Value,
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
    underlyingConnect,
    underlyingDisconnect,
    getUnderlyingTableHash,
    getUnderlyingRowIds,
    getUnderlyingRowHash,
    getUnderlyingCellIds,
    getUnderlyingCell,
    getUnderlyingCellTimestamp,
    setUnderlyingTableHash,
    setUnderlyingRowHash,
    setUnderlyingCell,
    setUnderlyingCellTimestamp,
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
        await underlyingConnect?.(underlyingSync);
      },

      disconnect: async () => {
        underlyingSync = undefined;
        await underlyingDisconnect?.();
      },

      getValue: ([rowId, cellId]: Address) => getUnderlyingCell(rowId, cellId),

      getTimestamp: ([rowId, cellId]: Address) =>
        getUnderlyingCellTimestamp(rowId, cellId),

      getHash: ([rowId]: Address) =>
        isUndefined(rowId)
          ? getUnderlyingTableHash()
          : getUnderlyingRowHash(rowId),

      setValue: ([rowId, cellId]: Address, value: Value) =>
        setUnderlyingCell(rowId, cellId, value),

      setTimestamp: ([rowId, cellId]: Address, timestamp: Timestamp) =>
        setUnderlyingCellTimestamp(rowId, cellId, timestamp),

      setHash: ([rowId]: Address, hash: number): Promise<void> =>
        isUndefined(rowId)
          ? setUnderlyingTableHash(hash)
          : setUnderlyingRowHash(rowId, hash),

      hasChildren: async (address: Address) => size(address) < 2,

      getChildren: async ([rowId, more]: Address) =>
        await (isUndefined(rowId)
          ? getUnderlyingRowIds()
          : isUndefined(more)
            ? getUnderlyingCellIds(rowId)
            : []),
    },
    options,
  );

  // --

  const getRowIds = getUnderlyingRowIds;
  const getCellIds = getUnderlyingCellIds;
  const getCell = getUnderlyingCell;

  const setCell = async (rowId: string, cellId: string, cell: Value) => {
    const timestamp = connector.getNextTimestamp();
    const hashChange =
      getTimestampHash(await getUnderlyingCellTimestamp(rowId, cellId)) ^
      getTimestampHash(timestamp);

    await setUnderlyingCell(rowId, cellId, cell);
    await setUnderlyingCellTimestamp(rowId, cellId, timestamp);
    await setUnderlyingRowHash(
      rowId,
      ((await getUnderlyingRowHash(rowId)) ^ hashChange) >>> 0,
    );
    await setUnderlyingTableHash(
      ((await getUnderlyingTableHash()) ^ hashChange) >>> 0,
    );
    await underlyingSync?.(rowId, cellId);
  };

  const delCell = (rowId: string, cellId: string): Promise<void> =>
    setUnderlyingCell(rowId, cellId, DELETED_VALUE);

  return {...connector, getRowIds, getCellIds, getCell, setCell, delCell};
};
