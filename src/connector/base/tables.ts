import {createConnector} from '@synclets';
import type {
  Address,
  Connector,
  ConnectorOptions,
  Timestamp,
  Value,
} from '@synclets/@types';
import type {
  createTablesConnector as createTablesConnectorDecl,
  TablesConnectorImplementations,
} from '@synclets/@types/connector/base';
import {size} from '@synclets/utils';

export const createTablesConnector: typeof createTablesConnectorDecl = (
  {
    connect: connectImpl,
    getTablesHash,
    getTableIds,
    getTableHash,
    getRowIds,
    getRowHash,
    getCellIds,
    getCell,
    getCellTimestamp,
    setTablesHash,
    setTableHash,
    setRowHash,
    setCell,
    setCellTimestamp,
  }: TablesConnectorImplementations = {},
  options?: ConnectorOptions,
): Connector => {
  const connect = async (sync: (address: Address) => Promise<void>) =>
    await connectImpl?.((tableId, rowId, cellId) =>
      tableId != null
        ? rowId != null
          ? cellId != null
            ? sync([tableId, rowId, cellId])
            : sync([tableId, rowId])
          : sync([tableId])
        : sync([]),
    );

  const get = async ([tableId, rowId, cellId]: Address): Promise<Value> =>
    (await getCell?.(tableId, rowId, cellId)) ?? null;

  const getTimestamp = async ([
    tableId,
    rowId,
    cellId,
  ]: Address): Promise<Timestamp> =>
    (await getCellTimestamp?.(tableId, rowId, cellId)) ?? '';

  const getHash = async ([tableId, rowId]: Address): Promise<number> =>
    (await (tableId != null
      ? rowId != null
        ? getRowHash?.(tableId, rowId)
        : getTableHash?.(tableId)
      : getTablesHash?.())) ?? 0;

  const set = async (
    [tableId, rowId, cellId]: Address,
    value: Value,
  ): Promise<void> => await setCell?.(tableId, rowId, cellId, value);

  const setTimestamp = async (
    [tableId, rowId, cellId]: Address,
    timestamp: Timestamp,
  ): Promise<void> =>
    await setCellTimestamp?.(tableId, rowId, cellId, timestamp);

  const setHash = async (
    [tableId, rowId]: Address,
    hash: number,
  ): Promise<void> =>
    await (tableId != null
      ? rowId != null
        ? setRowHash?.(tableId, rowId, hash)
        : setTableHash?.(tableId, hash)
      : setTablesHash?.(hash));

  const hasChildren = async (address: Address): Promise<boolean> =>
    size(address) < 3;

  const getChildren = async ([tableId, rowId]: Address): Promise<string[]> =>
    (await (tableId != null
      ? rowId != null
        ? getCellIds?.(tableId, rowId)
        : getRowIds?.(tableId)
      : getTableIds?.())) ?? [];

  return createConnector(
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
};
