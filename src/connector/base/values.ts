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

      readAtom: ([valueId]: Address) => readValueAtom(valueId),

      readTimestamp: ([valueId]: Address) => readValueTimestamp(valueId),

      readHash: readValuesHash,

      writeAtom: ([valueId]: Address, value: Atom) =>
        writeValueAtom(valueId, value),

      writeTimestamp: ([valueId]: Address, timestamp: Timestamp) =>
        writeValueTimestamp(valueId, timestamp),

      writeHash: (_address: Address, hash: number) => writeValuesHash(hash),

      isParent: async (address: Address) => isEmpty(address),

      readChildIds: async (address: Address) =>
        isEmpty(address) ? await readValueIds() : [],
    },
    options,
  );

  // --

  return {
    ...connector,
    getValueIds: readValueIds,
    getValue: readValueAtom,

    setValue: async (
      valueId: string,
      value: Atom,
      context: Context,
    ): Promise<void> => {
      await connector.setAtom([valueId], value, context);
      await underlyingSync?.(valueId);
    },

    delValue: async (_valueId: string): Promise<void> => {},
  };
};
