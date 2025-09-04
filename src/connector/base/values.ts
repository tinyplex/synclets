import {createConnector} from '@synclets';
import type {
  Address,
  Atom,
  ConnectorOptions,
  Context,
  Timestamp,
} from '@synclets/@types';
import type {
  BaseValuesConnector,
  BaseValuesConnectorImplementations,
  createBaseValuesConnector as createBaseValuesConnectorDecl,
} from '@synclets/@types/connector/base';
import {isEmpty, isUndefined} from '@synclets/utils';

export const createBaseValuesConnector: typeof createBaseValuesConnectorDecl = (
  {
    connect,
    disconnect,
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
        await connect?.(underlyingSync);
      },

      disconnect: async () => {
        underlyingSync = undefined;
        await disconnect?.();
      },

      readAtom: ([valueId]: Address) => getValueAtom(valueId),

      readTimestamp: ([valueId]: Address) => getValueTimestamp(valueId),

      readHash: getValuesHash,

      writeAtom: ([valueId]: Address, value: Atom) =>
        setValueAtom(valueId, value),

      writeTimestamp: ([valueId]: Address, timestamp: Timestamp) =>
        setValueTimestamp(valueId, timestamp),

      writeHash: (_address: Address, hash: number) => setValuesHash(hash),

      hasChildren: async (address: Address) => isEmpty(address),

      readChildrenIds: async (address: Address) =>
        isEmpty(address) ? await getValueIds() : [],
    },
    options,
  );

  // --

  const getValue = getValueAtom;

  const setManagedValue = async (
    valueId: string,
    value: Atom,
    context: Context,
  ): Promise<void> => {
    await connector.setManagedAtom([valueId], value, context);
    await underlyingSync?.(valueId);
  };

  const delValue = async (_valueId: string): Promise<void> => {};

  return {...connector, getValueIds, getValue, setManagedValue, delValue};
};
