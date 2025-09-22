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
import {Tomb} from '@synclets/@types/utils';
import {getUniqueId} from '@synclets/utils';
import {arrayPush} from '../common/array.ts';
import {combineHash, getHash} from '../common/codec.ts';
import {getHlcFunctions} from '../common/hlc.ts';
import {errorNew, isEmpty, isUndefined} from '../common/other.ts';
import {setEvery, setNew} from '../common/set.ts';
import type {ProtectedConnector} from './protected.js';
import {getQueueFunctions} from './queue.ts';

export const createConnector: typeof createConnectorDecl = async (
  atomDepth,
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
    readChildIds,
  }: ConnectorImplementations,
  options: ConnectorOptions = {},
): Promise<ProtectedConnector> => {
  if (atomDepth < 1) {
    errorNew('atomDepth must be positive');
  }

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
    atomDepth,

    log,

    bind: (synclet: Synclet, syncletId: string) => {
      boundSynclets.add(synclet);
      if (boundSynclets.size == 1) {
        id = syncletId;
      }
    },

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

    readAtom,

    readTimestamp,

    readHash,

    readChildIds,

    getData: () => ({}),

    getMeta: () => [0, {}],
  };
};
