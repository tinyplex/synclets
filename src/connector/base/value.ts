import {createConnector} from '@synclets';
import type {
  Address,
  Atom,
  ConnectorOptions,
  Timestamp,
} from '@synclets/@types';
import type {
  BaseValueConnector,
  BaseValueConnectorImplementations,
  createBaseValueConnector as createBaseValueConnectorDecl,
} from '@synclets/@types/connector/base';
import {DELETED_VALUE} from '@synclets/utils';

export const createBaseValueConnector: typeof createBaseValueConnectorDecl = (
  {
    underlyingConnect,
    underlyingDisconnect,
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
        await underlyingConnect?.(underlyingSync);
      },

      disconnect: async () => {
        underlyingSync = undefined;
        await underlyingDisconnect?.();
      },

      getAtom: getValueAtom,

      getTimestamp: getValueTimestamp,

      getHash: async () => undefined,

      setAtom: (_address: Address, atom: Atom) => setValueAtom(atom),

      setTimestamp: (_address: Address, timestamp: Timestamp) =>
        setValueTimestamp(timestamp),

      setHash: async () => {},

      hasChildren: async () => false,

      getChildren: async () => [],
    },
    options,
  );

  // --

  const getValue = getValueAtom;

  const setValue = async (value: Atom): Promise<void> => {
    await setValueAtom?.(value);
    await setValueTimestamp(connector.getNextTimestamp());
    await underlyingSync?.();
  };

  const delValue = (): Promise<void> => setValue(DELETED_VALUE);

  return {...connector, getValue, setValue, delValue};
};
