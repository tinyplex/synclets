import {createConnector} from '@synclets';
import type {
  Address,
  Connector,
  ConnectorOptions,
  Timestamp,
  Value,
} from '@synclets/@types';
import type {
  BaseTableConnectorImplementations,
  createBaseTableConnector as createBaseTableConnectorDecl,
} from '@synclets/@types/connector/base';
import {size} from '@synclets/utils';

export const createBaseTableConnector: typeof createBaseTableConnectorDecl = (
  {
    connect: connectImpl,
    getTableHash,
    getRowIds,
    getRowHash,
    getCellIds,
    getCell,
    getCellTimestamp,
    setTableHash,
    setRowHash,
    setCell,
    setCellTimestamp,
  }: BaseTableConnectorImplementations = {},
  options?: ConnectorOptions,
): Connector => {
  const connect = async (sync: (address: Address) => Promise<void>) =>
    await connectImpl?.((rowId, cellId) =>
      rowId != null
        ? cellId != null
          ? sync([rowId, cellId])
          : sync([rowId])
        : sync([]),
    );

  const get = async ([rowId, cellId]: Address): Promise<Value> =>
    (await getCell?.(rowId, cellId)) ?? null;

  const getTimestamp = async ([rowId, cellId]: Address): Promise<Timestamp> =>
    (await getCellTimestamp?.(rowId, cellId)) ?? '';

  const getHash = async ([rowId]: Address): Promise<number> =>
    (await (rowId != null ? getRowHash?.(rowId) : getTableHash?.())) ?? 0;

  const set = async ([rowId, cellId]: Address, value: Value): Promise<void> =>
    await setCell?.(rowId, cellId, value);

  const setTimestamp = async (
    [rowId, cellId]: Address,
    timestamp: Timestamp,
  ): Promise<void> => await setCellTimestamp?.(rowId, cellId, timestamp);

  const setHash = async ([rowId]: Address, hash: number): Promise<void> =>
    await (rowId != null ? setRowHash?.(rowId, hash) : setTableHash?.(hash));

  const hasChildren = async (address: Address): Promise<boolean> =>
    size(address) < 2;

  const getChildren = async ([rowId]: Address): Promise<string[]> =>
    (await (rowId != null ? getCellIds?.(rowId) : getRowIds?.())) ?? [];

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
