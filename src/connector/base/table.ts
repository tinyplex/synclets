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
    connect: connectImpl,
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

  const connect = async (sync: (address: Address) => Promise<void>) => {
    underlyingSync = (rowId, cellId) =>
      isUndefined(rowId)
        ? sync([])
        : isUndefined(cellId)
          ? sync([rowId])
          : sync([rowId, cellId]);
    await connectImpl?.(underlyingSync);
  };

  const get = ([rowId, cellId]: Address): Promise<Value> =>
    getUnderlyingCell(rowId, cellId);

  const getTimestamp = ([rowId, cellId]: Address): Promise<Timestamp> =>
    getUnderlyingCellTimestamp(rowId, cellId);

  const getHash = ([rowId]: Address): Promise<number> =>
    isUndefined(rowId) ? getUnderlyingTableHash() : getUnderlyingRowHash(rowId);

  const set = ([rowId, cellId]: Address, value: Value): Promise<void> =>
    setUnderlyingCell(rowId, cellId, value);

  const setTimestamp = (
    [rowId, cellId]: Address,
    timestamp: Timestamp,
  ): Promise<void> => setUnderlyingCellTimestamp(rowId, cellId, timestamp);

  const setHash = ([rowId]: Address, hash: number): Promise<void> =>
    isUndefined(rowId)
      ? setUnderlyingTableHash(hash)
      : setUnderlyingRowHash(rowId, hash);

  const hasChildren = async (address: Address): Promise<boolean> =>
    size(address) < 2;

  const getChildren = async ([rowId, more]: Address): Promise<string[]> =>
    await (isUndefined(rowId)
      ? getUnderlyingRowIds()
      : isUndefined(more)
        ? getUnderlyingCellIds(rowId)
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
