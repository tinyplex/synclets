import type {
  Address,
  Atom,
  ConnectorImplementations,
  ConnectorOptions,
  Context,
  createConnector as createConnectorDecl,
  Hash,
  LogLevel,
  Synclet,
  Timestamp,
} from '@synclets/@types';
import {errorNew, getHlcFunctions} from '@synclets/utils';
import type {ProtectedConnector} from '../protected.d.ts';

export const createConnector: typeof createConnectorDecl = (
  {
    connect: connectImpl,
    disconnect: disconnectImpl,
    getAtom,
    getHash,
    getTimestamp,
    setAtom,
    setHash,
    setTimestamp,
    hasChildren,
    getChildren,
  }: ConnectorImplementations,
  options: ConnectorOptions = {},
): ProtectedConnector => {
  let attachedSynclet: Synclet | undefined;
  const logger = options.logger ?? {};

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[${attachedSynclet?.getId() ?? ''}/C] ${string}`);

  const [getNextTimestamp, seenTimestamp, setUniqueId] = getHlcFunctions();

  // --

  return {
    __brand: 'Connector',

    getNextTimestamp,
    log,

    attachToSynclet: (synclet: Synclet) => {
      if (attachedSynclet) {
        errorNew(
          'Connector is already attached to Synclet ' + attachedSynclet.getId(),
        );
      }
      attachedSynclet = synclet;
      setUniqueId(attachedSynclet.getId());
    },

    connect: async (sync: (address: Address) => Promise<void>) =>
      await connectImpl?.(sync),

    disconnect: async () => await disconnectImpl?.(),

    getAtom,

    getTimestamp: async (address: Address, context: Context) =>
      (await getTimestamp(address, context)) ?? '',

    getHash: async (address: Address, context: Context) =>
      (await getHash(address, context)) ?? 0,

    setAtom: async (address: Address, value: Atom, context: Context) =>
      await setAtom(address, value, context),

    setTimestamp: async (
      address: Address,
      timestamp: Timestamp,
      context: Context,
    ) => {
      seenTimestamp(timestamp);
      await setTimestamp(address, timestamp, context);
    },

    setHash: async (address: Address, hash: Hash, context: Context) =>
      await setHash(address, hash, context),

    hasChildren: async (address: Address, context: Context) =>
      (await hasChildren(address, context)) ?? false,

    getChildren: async (address: Address, context: Context) =>
      (await getChildren(address, context)) ?? [],
  };
};
