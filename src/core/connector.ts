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
  let started = false;
  let attachedSynclet: Synclet | undefined;

  const id = options.id ?? getUniqueId();
  const logger = options.logger ?? {};

  const [getNextTimestamp, seenTimestamp, setUniqueId] = getHlcFunctions();

  const [queue] = getQueueFunctions();

  // --

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[C:${id}] ${string}`);

  const connector = {
    __brand: 'Connector',

    log,

    getId: () => id,

    getStarted: () => started,

    start: async () => {
      if (!started) {
        log('start');
        await connect?.();
        started = true;
      }
    },

    stop: async () => {
      if (started) {
        log('stop');
        await disconnect?.();
        started = false;
      }
    },

    setAtom: (
      address: Address,
      atomOrTomb: Atom | Tomb,
      context?: Context,
      sync?: boolean,
    ) => connector.setOrDelAtom(address, atomOrTomb, context, sync),

    delAtom: (address: Address, context?: Context, sync?: boolean) =>
      connector.setOrDelAtom(address, TOMB, context, sync),

    setOrDelAtom: async (
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
        oldTimestamp = await connector.readTimestamp(address, context);
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
              combineHash(
                await connector.readHash(queuedAddress, context),
                hashChange,
              ),
              context,
            );
          });
        }
      }
      if (sync) {
        arrayPush(tasks, () => attachedSynclet?.sync(address));
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

    connect,
    disconnect,
    readAtom,
    readTimestamp,
    readHash,
    isParent,
    readChildIds,
  } as const;

  return connector;
};
