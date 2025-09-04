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
  isUndefined,
} from '@synclets/utils';
import type {ProtectedConnector} from '../protected.d.ts';
import {getQueueFunctions} from '../queue.ts';

export const createConnector: typeof createConnectorDecl = (
  {
    connect: connectImpl,
    disconnect: disconnectImpl,
    readAtom,
    readTimestamp: readTimestampImpl,
    readHash: readHashImpl,
    writeAtom,
    writeTimestamp,
    writeHash,
    hasChildren,
    readChildrenIds,
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

  const getTimestamp = async (address: Address, context: Context) =>
    (await readTimestampImpl(address, context)) ?? '';

  const getHash = async (address: Address, context: Context) =>
    (await readHashImpl(address, context)) ?? 0;

  return {
    __brand: 'Connector',

    getNextTimestamp,
    log,

    setManagedAtom: async (
      address: Address,
      atom: Atom,
      context: Context,
      newTimestamp?: Timestamp,
      oldTimestamp?: Timestamp,
    ) => {
      if (isUndefined(newTimestamp)) {
        newTimestamp = getNextTimestamp();
      } else {
        seenTimestamp(newTimestamp);
      }
      const tasks = [
        () => writeAtom(address, atom, context),
        () => writeTimestamp(address, newTimestamp, context),
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
            await writeHash(
              queuedAddress,
              ((await getHash(queuedAddress, context)) ^ hashChange) >>> 0,
              context,
            );
          });
        }
      }
      await queue(...tasks);
    },

    // --

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

    getAtom: readAtom,

    getTimestamp,

    getHash,

    hasChildren: async (address: Address, context: Context) =>
      (await hasChildren(address, context)) ?? false,

    getChildren: async (address: Address, context: Context) =>
      (await readChildrenIds(address, context)) ?? [],
  };
};
