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
  Tomb,
} from '@synclets/@types';
import {
  arrayPush,
  combineHash,
  getHash,
  getHlcFunctions,
  getUniqueId,
  isEmpty,
  isUndefined,
  setEvery,
  setNew,
} from '@synclets/utils';
import type {ProtectedConnector} from './protected.js';
import {getQueueFunctions} from './queue.ts';

export const createConnector: typeof createConnectorDecl = async (
  {
    connect,
    disconnect,
    readAtom,
    readTimestamp,
    readHash,
    writeAtom,
    writeTimestamp,
    writeHash,
    removeAtom,
    isParent,
    readChildIds,
  }: ConnectorImplementations,
  options: ConnectorOptions = {},
): Promise<ProtectedConnector> => {
  let connected = false;
  let id = options.id ?? getUniqueId();

  const boundSynclets: Set<Synclet> = setNew();

  const logger = options.logger ?? {};

  const [getNextTimestamp, seenTimestamp] = getHlcFunctions(id);

  const [queue] = getQueueFunctions();

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[${id}/C] ${string}`);

  const setOrDelAtom = async (
    address: Address,
    atomOrUndefined: Atom | undefined,
    context: Context = {},
    syncOrFromSynclet: boolean | Synclet = true,
    newTimestamp?: Timestamp,
    oldTimestamp?: Timestamp,
  ) => {
    if (!connected) {
      return;
    }
    if (isUndefined(newTimestamp)) {
      newTimestamp = getNextTimestamp();
    } else {
      seenTimestamp(newTimestamp);
    }
    if (isUndefined(oldTimestamp)) {
      oldTimestamp = await readTimestamp(address, context);
    }
    const tasks = [
      isUndefined(atomOrUndefined)
        ? () => removeAtom(address, context)
        : () => writeAtom(address, atomOrUndefined, context),
      () => writeTimestamp(address, newTimestamp, context),
    ];
    if (!isEmpty(address)) {
      const hashChange = combineHash(
        getHash(oldTimestamp),
        getHash(newTimestamp),
      );
      let parentAddress = [...address];
      while (!isEmpty(parentAddress)) {
        const queuedAddress = (parentAddress = parentAddress.slice(0, -1));
        arrayPush(tasks, async () => {
          await writeHash(
            queuedAddress,
            combineHash(await readHash(queuedAddress, context), hashChange),
            context,
          );
        });
      }
    }
    if (syncOrFromSynclet) {
      boundSynclets.forEach((boundSynclet) => {
        if (boundSynclet !== syncOrFromSynclet) {
          arrayPush(tasks, () => boundSynclet.sync(address));
        }
      });
    }
    await queue(...tasks);
  };

  return {
    log,

    connect: async () => {
      if (!connected) {
        log('connect');
        await connect?.();
        connected = true;
      }
    },

    disconnect: async () => {
      if (connected) {
        if (
          setEvery(boundSynclets, (boundSynclet) => !boundSynclet.isStarted())
        ) {
          log('disconnect');
          await disconnect?.();
          connected = false;
        }
      }
    },

    isConnected: () => connected,

    setAtom: (
      address: Address,
      atomOrTomb: Atom | Tomb,
      context?: Context,
      sync?: boolean,
    ) => setOrDelAtom(address, atomOrTomb, context, sync),

    delAtom: (address: Address, context?: Context, sync?: boolean) =>
      setOrDelAtom(address, undefined, context, sync),

    setOrDelAtom,

    bind: (synclet: Synclet, syncletId: string) => {
      boundSynclets.add(synclet);
      if (boundSynclets.size == 1) {
        id = syncletId;
      }
    },

    readAtom,

    readTimestamp,

    readHash,

    isParent,

    readChildIds,
  };
};
