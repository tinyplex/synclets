import {createConnector} from '@synclets';
import type {
  Address,
  Connector,
  ConnectorOptions,
  Timestamp,
  Value,
} from '@synclets/@types';
import type {
  createTableConnector as createTableConnectorDecl,
  TableConnectorImplementations,
} from '@synclets/@types/connector/table';
import {size} from '@synclets/utils';

export const createTableConnector: typeof createTableConnectorDecl = (
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
  }: TableConnectorImplementations = {},
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
    (rowId != null ? await getRowHash?.(rowId) : getTableHash?.()) ?? 0;

  const set = async ([rowId, cellId]: Address, value: Value): Promise<void> =>
    await setCell?.(rowId, cellId, value);

  const setTimestamp = async (
    [rowId, cellId]: Address,
    timestamp: Timestamp,
  ): Promise<void> => await setCellTimestamp?.(rowId, cellId, timestamp);

  const setHash = async ([rowId]: Address, hash: number): Promise<void> =>
    rowId != null
      ? await setRowHash?.(rowId, hash)
      : await setTableHash?.(hash);

  const hasChildren = async (address: Address): Promise<boolean> =>
    size(address) < 2;

  const getChildren = async ([rowId]: Address): Promise<string[]> =>
    (rowId != null ? await getCellIds?.(rowId) : await getRowIds?.()) ?? [];

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
