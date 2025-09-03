import {createConnector} from '@synclets';
import type {
  Address,
  Atom,
  ConnectorOptions,
  Timestamp,
} from '@synclets/@types';
import type {
  BaseValuesConnector,
  BaseValuesConnectorImplementations,
  createBaseValuesConnector as createBaseValuesConnectorDecl,
} from '@synclets/@types/connector/base';
import {
  DELETED_VALUE,
  getTimestampHash,
  isEmpty,
  isUndefined,
} from '@synclets/utils';

export const createBaseValuesConnector: typeof createBaseValuesConnectorDecl = (
  {
    underlyingConnect,
    underlyingDisconnect,
    getValuesHash,
    getValueIds,
    getValueAtom,
    getValueTimestamp,
    setValuesHash,
    setValueAtom,
    setValueTimestamp,
  }: BaseValuesConnectorImplementations,
  options?: ConnectorOptions,
): BaseValuesConnector => {
  let underlyingSync: ((valueId?: string) => Promise<void>) | undefined;

  const connector = createConnector(
    {
      connect: async (sync: (address: Address) => Promise<void>) => {
        underlyingSync = (valueId) =>
          isUndefined(valueId) ? sync([]) : sync([valueId]);
        await underlyingConnect?.(underlyingSync);
      },

      disconnect: async () => {
        underlyingSync = undefined;
        await underlyingDisconnect?.();
      },

      getAtom: ([valueId]: Address) => getValueAtom(valueId),

      getTimestamp: ([valueId]: Address) => getValueTimestamp(valueId),

      getHash: getValuesHash,

      setAtom: ([valueId]: Address, value: Atom) =>
        setValueAtom(valueId, value),

      setTimestamp: ([valueId]: Address, timestamp: Timestamp) =>
        setValueTimestamp(valueId, timestamp),

      setHash: (_address: Address, hash: number) => setValuesHash(hash),

      hasChildren: async (address: Address) => isEmpty(address),

      getChildren: async (address: Address) =>
        isEmpty(address) ? await getValueIds() : [],
    },
    options,
  );

  // --

  const getValue = getValueAtom;

  const setValue = async (valueId: string, value: Atom): Promise<void> => {
    const timestamp = connector.getNextTimestamp();
    const hashChange =
      getTimestampHash(await getValueTimestamp(valueId)) ^
      getTimestampHash(timestamp);

    await setValueAtom(valueId, value);
    await setValueTimestamp(valueId, timestamp);
    await setValuesHash((((await getValuesHash()) ?? 0) ^ hashChange) >>> 0);
    await underlyingSync?.(valueId);
  };

  const delValue = (valueId: string): Promise<void> =>
    setValue(valueId, DELETED_VALUE);

  return {...connector, getValueIds, getValue, setValue, delValue};
};
