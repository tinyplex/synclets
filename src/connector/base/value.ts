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
    getValueAtom,
    getValueTimestamp,
    setValueAtom,
    setValueTimestamp,
  }: BaseValueConnectorImplementations,
  options?: ConnectorOptions,
): BaseValueConnector => {
  let underlyingSync: (() => Promise<void>) | undefined;

  const connector = createConnector(
    {
      connect: async (sync: (address: Address) => Promise<void>) => {
        underlyingSync = () => sync([]);
        await connect?.(underlyingSync);
      },

      disconnect: async () => {
        underlyingSync = undefined;
        await disconnect?.();
      },

      readAtom: getValueAtom,

      readTimestamp: getValueTimestamp,

      readHash: async () => undefined,

      writeAtom: (_address: Address, atom: Atom) => setValueAtom(atom),

      writeTimestamp: (_address: Address, timestamp: Timestamp) =>
        setValueTimestamp(timestamp),

      writeHash: async () => {},

      hasChildren: async () => false,

      readChildrenIds: async () => [],
    },
    options,
  );

  // --

  const getValue = getValueAtom;

  const setManagedValue = async (
    value: Atom,
    context: Context,
  ): Promise<void> => {
    await connector.setManagedAtom([], value, context);
    await underlyingSync?.();
  };

  const delValue = async (): Promise<void> => {};

  return {...connector, getValue, setManagedValue, delValue};
};
