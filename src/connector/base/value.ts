import {createConnector} from '@synclets';
import type {
  Address,
  Atom,
  ConnectorOptions,
  Context,
  Timestamp,
} from '@synclets/@types';
import type {
  BaseValueConnector,
  BaseValueConnectorImplementations,
  createBaseValueConnector as createBaseValueConnectorDecl,
} from '@synclets/@types/connector/base';

export const createBaseValueConnector: typeof createBaseValueConnectorDecl = (
  {
    connect,
    disconnect,
    readValueAtom,
    readValueTimestamp,
    writeValueAtom,
    writeValueTimestamp,
  }: BaseValueConnectorImplementations,
  options?: ConnectorOptions,
): BaseValueConnector => {
  let underlyingSync: (() => Promise<void>) | undefined;

  const connector = createConnector(
    {
      connect: async (sync?: (address: Address) => Promise<void>) => {
        underlyingSync = sync ? () => sync([]) : undefined;
        await connect?.(underlyingSync);
      },

      disconnect: async () => {
        underlyingSync = undefined;
        await disconnect?.();
      },

      readAtom: (_address: Address, context: Context) => readValueAtom(context),

      readTimestamp: (_address: Address, context: Context) =>
        readValueTimestamp(context),

      readHash: async () => undefined,

      writeAtom: (_address: Address, atom: Atom, context: Context) =>
        writeValueAtom(atom, context),

      writeTimestamp: (
        _address: Address,
        timestamp: Timestamp,
        context: Context,
      ) => writeValueTimestamp(timestamp, context),

      writeHash: async () => {},

      isParent: async () => false,

      readChildIds: async () => [],
    },
    options,
  );

  // --

  return {
    ...connector,

    getValue: (context: Context = {}) => readValueAtom(context),

    setValue: async (value: Atom, context: Context = {}) => {
      await connector.setAtom([], value, context);
      await underlyingSync?.();
    },

    delValue: async () => {},
  };
};
