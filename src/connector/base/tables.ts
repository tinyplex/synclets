import {createConnector} from '@synclets';
import type {
  Address,
  ConnectorOptions,
  Timestamp,
  Value,
} from '@synclets/@types';
import type {
  BaseTablesConnector,
  BaseTablesConnectorImplementations,
  createBaseTablesConnector as createBaseTablesConnectorDecl,
} from '@synclets/@types/connector/base';
import {
  DELETED_VALUE,
  getTimestampHash,
  isUndefined,
  size,
} from '@synclets/utils';

export const createBaseTablesConnector: typeof createBaseTablesConnectorDecl = (
  {
    connect: connectImpl,
    getUnderlyingTablesHash,
    getUnderlyingTableIds,
    getUnderlyingTableHash,
    getUnderlyingRowIds,
    getUnderlyingRowHash,
    getUnderlyingCellIds,
    getUnderlyingCell,
    getUnderlyingCellTimestamp,
    setUnderlyingTablesHash,
    setUnderlyingTableHash,
    setUnderlyingRowHash,
    setUnderlyingCell,
    setUnderlyingCellTimestamp,
  }: BaseTablesConnectorImplementations,
  options?: ConnectorOptions,
): BaseTablesConnector => {
  let underlyingSync:
    | ((tableId?: string, rowId?: string, cellId?: string) => Promise<void>)
    | undefined;

  const connect = async (sync: (address: Address) => Promise<void>) => {
    underlyingSync = (tableId, rowId, cellId) =>
      isUndefined(tableId)
        ? sync([])
        : isUndefined(rowId)
          ? sync([tableId])
          : isUndefined(cellId)
            ? sync([tableId, rowId])
            : sync([tableId, rowId, cellId]);
    await connectImpl?.(underlyingSync);
  };

  const get = ([tableId, rowId, cellId]: Address): Promise<Value> =>
    getUnderlyingCell(tableId, rowId, cellId);

  const getTimestamp = ([
    tableId,
    rowId,
    cellId,
  ]: Address): Promise<Timestamp> =>
    getUnderlyingCellTimestamp(tableId, rowId, cellId);

  const getHash = ([tableId, rowId]: Address): Promise<number> =>
    isUndefined(tableId)
      ? getUnderlyingTablesHash()
      : isUndefined(rowId)
        ? getUnderlyingTableHash(tableId)
        : getUnderlyingRowHash(tableId, rowId);

  const set = (
    [tableId, rowId, cellId]: Address,
    value: Value,
  ): Promise<void> => setUnderlyingCell(tableId, rowId, cellId, value);

  const setTimestamp = (
    [tableId, rowId, cellId]: Address,
    timestamp: Timestamp,
  ): Promise<void> =>
    setUnderlyingCellTimestamp(tableId, rowId, cellId, timestamp);

  const setHash = ([tableId, rowId]: Address, hash: number): Promise<void> =>
    isUndefined(tableId)
      ? setUnderlyingTablesHash(hash)
      : isUndefined(rowId)
        ? setUnderlyingTableHash(tableId, hash)
        : setUnderlyingRowHash(tableId, rowId, hash);

  const hasChildren = async (address: Address): Promise<boolean> =>
    size(address) < 3;

  const getChildren = async ([tableId, rowId, more]: Address): Promise<
    string[]
  > =>
    await (isUndefined(tableId)
      ? getUnderlyingTableIds()
      : isUndefined(rowId)
        ? getUnderlyingRowIds(tableId)
        : isUndefined(more)
          ? getUnderlyingCellIds(tableId, rowId)
          : []);

  const connector = createConnector(
    {
      connect,
      get,
      getTimestamp,
      getHash,
      set,
      setTimestamp,
      setHash,
      hasChildren,
      getChildren,
    },
    options,
  );

  // --

  const getTableIds = getUnderlyingTableIds;
  const getRowIds = getUnderlyingRowIds;
  const getCellIds = getUnderlyingCellIds;
  const getCell = getUnderlyingCell;

  const setCell = async (
    tableId: string,
    rowId: string,
    cellId: string,
    cell: Value,
  ) => {
    const timestamp = connector.getNextTimestamp();
    const hashChange =
      getTimestampHash(
        await getUnderlyingCellTimestamp(tableId, rowId, cellId),
      ) ^ getTimestampHash(timestamp);

    await setUnderlyingCell(tableId, rowId, cellId, cell);
    await setUnderlyingCellTimestamp(tableId, rowId, cellId, timestamp);
    await setUnderlyingRowHash(
      tableId,
      rowId,
      ((await getUnderlyingRowHash(tableId, rowId)) ^ hashChange) >>> 0,
    );
    await setUnderlyingTableHash(
      tableId,
      ((await getUnderlyingTableHash(tableId)) ^ hashChange) >>> 0,
    );
    await setUnderlyingTablesHash(
      (await getUnderlyingTablesHash()) ^ hashChange,
    );
    await underlyingSync?.(tableId, rowId, cellId);
  };

  const delCell = (
    tableId: string,
    rowId: string,
    cellId: string,
  ): Promise<void> => setUnderlyingCell(tableId, rowId, cellId, DELETED_VALUE);

  return {
    ...connector,
    getTableIds,
    getRowIds,
    getCellIds,
    getCell,
    setCell,
    delCell,
  };
};
