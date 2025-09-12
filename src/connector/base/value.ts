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

export const createBaseValueConnector: typeof createBaseValueConnectorDecl =
  async (
    {
      connect,
      disconnect,
      readValueAtom,
      readValueTimestamp,
      writeValueAtom,
      writeValueTimestamp,
      removeValueAtom,
    }: BaseValueConnectorImplementations,
    options?: ConnectorOptions,
  ): Promise<BaseValueConnector> => {
    const connector = await createConnector(
      {
        connect,

        disconnect,

        readAtom: (_address: Address, context: Context) =>
          readValueAtom(context),

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

        removeAtom: (_address: Address, context: Context) =>
          removeValueAtom(context),

        isParent: async () => false,

        readChildIds: async () => [],
      },
      options,
    );

    // --

    return {
      ...connector,

      getValue: (context: Context = {}) => readValueAtom(context),

      setValue: (value: Atom, context: Context = {}, sync?: boolean) =>
        connector.setAtom([], value, context, sync),

      delValue: (context: Context = {}, sync?: boolean) =>
        connector.delAtom([], context, sync),
    };
  };
