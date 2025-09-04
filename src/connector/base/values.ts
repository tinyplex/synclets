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
    readValuesHash,
    readValueIds,
    readValueAtom,
    readValueTimestamp,
    writeValuesHash,
    writeValueAtom,
    writeValueTimestamp,
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

      readAtom: ([valueId]: Address) => readValueAtom(valueId),

      readTimestamp: ([valueId]: Address) => readValueTimestamp(valueId),

      readHash: readValuesHash,

      writeAtom: ([valueId]: Address, value: Atom) =>
        writeValueAtom(valueId, value),

      writeTimestamp: ([valueId]: Address, timestamp: Timestamp) =>
        writeValueTimestamp(valueId, timestamp),

      writeHash: (_address: Address, hash: number) => writeValuesHash(hash),

      hasChildren: async (address: Address) => isEmpty(address),

      readChildrenIds: async (address: Address) =>
        isEmpty(address) ? await readValueIds() : [],
    },
    options,
  );

  // --

  const getValue = readValueAtom;

  const setManagedValue = async (
    valueId: string,
    value: Atom,
    context: Context,
  ): Promise<void> => {
    await connector.setManagedAtom([valueId], value, context);
    await underlyingSync?.(valueId);
  };

  const delValue = async (_valueId: string): Promise<void> => {};

  return {
    ...connector,
    getValueIds: readValueIds,
    getValue,
    setManagedValue,
    delValue,
  };
};
