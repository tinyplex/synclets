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
    removeValueAtom,
  }: BaseValuesConnectorImplementations,
  options?: ConnectorOptions,
): BaseValuesConnector => {
  let underlyingSync: ((valueId?: string) => Promise<void>) | undefined;

  const connector = createConnector(
    {
      connect: async (sync?: (address: Address) => Promise<void>) => {
        underlyingSync = sync
          ? (valueId) => (isUndefined(valueId) ? sync([]) : sync([valueId]))
          : undefined;
        await connect?.(underlyingSync);
      },

      disconnect: async () => {
        underlyingSync = undefined;
        await disconnect?.();
      },

      readAtom: ([valueId]: Address, context: Context) =>
        readValueAtom(valueId, context),

      readTimestamp: ([valueId]: Address, context: Context) =>
        readValueTimestamp(valueId, context),

      readHash: (_address: Address, context: Context) =>
        readValuesHash(context),

      writeAtom: ([valueId]: Address, value: Atom, context: Context) =>
        writeValueAtom(valueId, value, context),

      writeTimestamp: (
        [valueId]: Address,
        timestamp: Timestamp,
        context: Context,
      ) => writeValueTimestamp(valueId, timestamp, context),

      writeHash: (_address: Address, hash: number, context: Context) =>
        writeValuesHash(hash, context),

      removeAtom: ([valueId]: Address, context: Context) =>
        removeValueAtom(valueId, context),

      isParent: async (address: Address) => isEmpty(address),

      readChildIds: async (address: Address, context: Context) =>
        isEmpty(address) ? await readValueIds(context) : [],
    },
    options,
  );

  // --

  return {
    ...connector,

    getValueIds: (context: Context = {}) => readValueIds(context),

    getValue: (valueId: string, context: Context = {}) =>
      readValueAtom(valueId, context),

    setValue: async (
      valueId: string,
      value: Atom,
      context: Context = {},
    ): Promise<void> => {
      await connector.setAtom([valueId], value, context);
      await underlyingSync?.(valueId);
    },

    delValue: async (valueId: string, context: Context = {}): Promise<void> => {
      await connector.delAtom([valueId], context);
      await underlyingSync?.(valueId);
    },
  };
};
