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
  errorNew,
  getHash,
  getHlcFunctions,
  getUniqueId,
  isEmpty,
  isUndefined,
  TOMB,
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
  let attachedSynclet: Synclet | undefined;
  let id = options.id ?? getUniqueId();

  const logger = options.logger ?? {};

  const [getNextTimestamp, seenTimestamp] = getHlcFunctions(id);

  const [queue] = getQueueFunctions();

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[${id}/C] ${string}`);

  const setOrDelAtom = async (
    address: Address,
    atomOrTomb: Atom | Tomb,
    context: Context = {},
    sync = true,
    newTimestamp?: Timestamp,
    oldTimestamp?: Timestamp,
  ) => {
    if (isUndefined(newTimestamp)) {
      newTimestamp = getNextTimestamp();
    } else {
      seenTimestamp(newTimestamp);
    }
    if (isUndefined(oldTimestamp)) {
      oldTimestamp = await readTimestamp(address, context);
    }
    const tasks = [
      atomOrTomb === TOMB
        ? () => removeAtom(address, context)
        : () => writeAtom(address, atomOrTomb, context),
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
    if (sync) {
      arrayPush(tasks, () => attachedSynclet?.sync(address));
    }
    await queue(...tasks);
  };

  return {
    __brand: 'Connector',

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
        log('disconnect');
        await disconnect?.();
        connected = false;
      }
    },

    setAtom: (
      address: Address,
      atomOrTomb: Atom | Tomb,
      context?: Context,
      sync?: boolean,
    ) => setOrDelAtom(address, atomOrTomb, context, sync),

    delAtom: (address: Address, context?: Context, sync?: boolean) =>
      setOrDelAtom(address, TOMB, context, sync),

    setOrDelAtom,

    bind: (synclet: Synclet, syncletId: string) => {
      if (attachedSynclet) {
        errorNew('Connector is already attached to Synclet');
      }
      attachedSynclet = synclet;
      id = syncletId;
    },

    readAtom,
    readTimestamp,
    readHash,
    isParent,
    readChildIds,
  };
};
