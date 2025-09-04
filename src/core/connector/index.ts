import type {
  Address,
  Atom,
  ConnectorImplementations,
  ConnectorOptions,
  Context,
  createConnector as createConnectorDecl,
  LogLevel,
  Synclet,
  Timestamp,
} from '@synclets/@types';
import {
  arrayPush,
  errorNew,
  getHlcFunctions,
  getTimestampHash,
  isEmpty,
} from '@synclets/utils';
import type {ProtectedConnector} from '../protected.d.ts';
import {getQueueFunctions} from '../queue.ts';

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

  const [queue] = getQueueFunctions();

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

    setManagedAtom: async (
      address: Address,
      atom: Atom,
      context: Context,
      newTimestamp: Timestamp,
      oldTimestamp?: Timestamp,
    ) => {
      seenTimestamp(newTimestamp);
      const tasks = [
        () => setAtom(address, atom, context),
        () => setTimestamp(address, newTimestamp, context),
      ];
      if (!isEmpty(address)) {
        const hashChange =
          (getTimestampHash(
            oldTimestamp ?? (await getTimestamp(address, context)),
          ) ^
            getTimestampHash(newTimestamp)) >>>
          0;
        let parentAddress = [...address];
        while (!isEmpty(parentAddress)) {
          const queuedAddress = (parentAddress = parentAddress.slice(0, -1));
          arrayPush(tasks, async () => {
            await setHash(
              queuedAddress,
              (((await getHash(queuedAddress, context)) ?? 0) ^ hashChange) >>>
                0,
              context,
            );
          });
        }
      }
      await queue(...tasks);
    },

    hasChildren: async (address: Address, context: Context) =>
      (await hasChildren(address, context)) ?? false,

    getChildren: async (address: Address, context: Context) =>
      (await getChildren(address, context)) ?? [],
  };
};
