import type {
  Address,
  Atom,
  ConnectorImplementations,
  ConnectorOptions,
  Context,
  createConnector as createConnectorDecl,
  Data,
  Hash,
  LogLevel,
  Meta,
  Synclet,
  Timestamp,
} from '@synclets/@types';
import {Tomb} from '@synclets/@types/utils';
import {getUniqueId} from '@synclets/utils';
import {arrayMap, arrayPush} from '../common/array.ts';
import {combineHash, getHash} from '../common/codec.ts';
import {getHlcFunctions} from '../common/hlc.ts';
import {objNotEmpty} from '../common/object.ts';
import {
  errorNew,
  ifNotUndefined,
  isEmpty,
  isUndefined,
  promiseAll,
  size,
} from '../common/other.ts';
import {getQueueFunctions} from '../common/queue.ts';
import {setEvery, setNew} from '../common/set.ts';
import {ProtectedConnector} from './types.js';

export const createConnector: typeof createConnectorDecl = async (
  depth,
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
  if (depth < 1) {
    errorNew('depth must be positive');
  }

  let connected = false;
  let id = options.id ?? getUniqueId();

  const boundSynclets: Set<Synclet> = setNew();

  const logger = options.logger ?? {};

  const [getNextTimestamp, seenTimestamp] = getHlcFunctions(id);

  const [queue] = getQueueFunctions();

  const getData = async (address: Address): Promise<Data | undefined> => {
    const data = {} as {[id: string]: Data | Atom};
    await promiseAll(
      arrayMap((await readChildIds(address, {})) ?? [], async (childId) =>
        ifNotUndefined(
          await (size(address) == depth - 1 ? readAtom : getData)(
            [...address, childId],
            {},
          ),
          (childData) => {
            data[childId] = childData;
          },
        ),
      ),
    );
    return objNotEmpty(data) ? data : (undefined as any);
  };

  const getMeta = async (
    address: Address,
  ): Promise<Meta | Timestamp | undefined> => {
    const meta = [await readHash(address, {}), {}] as [
      Hash,
      {[id: string]: Meta | Timestamp},
    ];
    await promiseAll(
      arrayMap((await readChildIds(address, {})) ?? [], async (childId) => {
        ifNotUndefined(
          await (size(address) == depth - 1 ? readTimestamp : getMeta)(
            [...address, childId],
            {},
          ),
          (childData) => {
            meta[1][childId] = childData;
          },
        );
      }),
    );
    return !isUndefined(meta[0]) ? meta : undefined;
  };

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[${id}/C] ${string}`);

  const bind = (synclet: Synclet, syncletId: string) => {
    boundSynclets.add(synclet);
    if (boundSynclets.size == 1) {
      id = syncletId;
    }
  };

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

    getData: async () => ((await getData([])) ?? {}) as Data,

    getMeta: async () => (await getMeta([])) as Meta,

    _: [
      depth,
      bind,
      readAtom,
      readTimestamp,
      readHash,
      readChildIds,
      setOrDelAtom,
    ],
  };
};
