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

      readAtom: readValueAtom,

      readTimestamp: readValueTimestamp,

      readHash: async () => undefined,

      writeAtom: (_address: Address, atom: Atom) => writeValueAtom(atom),

      writeTimestamp: (_address: Address, timestamp: Timestamp) =>
        writeValueTimestamp(timestamp),

      writeHash: async () => {},

      isParent: async () => false,

      readAtomIds: async () => [],

      readDeletedAtomIds: async () => [],
    },
    options,
  );

  // --

  return {
    ...connector,
    getValue: readValueAtom,

    setValue: async (value: Atom, context: Context) => {
      await connector.setAtom([], value, context);
      await underlyingSync?.();
    },

    delValue: async () => {},
  };
};
