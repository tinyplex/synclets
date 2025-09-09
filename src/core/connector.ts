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
  EMPTY_STRING,
  errorNew,
  getHash,
  getHlcFunctions,
  isEmpty,
  isUndefined,
  TOMB,
} from '@synclets/utils';
import type {ProtectedConnector} from './protected.js';
import {getQueueFunctions} from './queue.ts';

export const createConnector: typeof createConnectorDecl = (
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
): ProtectedConnector => {
  let attachedSynclet: Synclet | undefined;
  const logger = options.logger ?? {};

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(
      `[${attachedSynclet?.getId() ?? EMPTY_STRING}/C] ${string}`,
    );

  const [getNextTimestamp, seenTimestamp, setUniqueId] = getHlcFunctions();

  const [queue] = getQueueFunctions();

  const setOrDelAtom = async (
    address: Address,
    atomOrTomb: Atom | Tomb,
    context: Context = {},
    newTimestamp?: Timestamp,
    oldTimestamp?: Timestamp,
  ) => {
    if (isUndefined(newTimestamp)) {
      newTimestamp = getNextTimestamp();
    } else {
      seenTimestamp(newTimestamp);
    }
    const tasks = [
      atomOrTomb === TOMB
        ? () => removeAtom(address, context)
        : () => writeAtom(address, atomOrTomb, context),
      () => writeTimestamp(address, newTimestamp, context),
    ];
    if (!isEmpty(address)) {
      const hashChange = combineHash(
        getHash(
          oldTimestamp ?? (await connector.readTimestamp(address, context)),
        ),
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
    await queue(...tasks);
  };

  // --

  const connector = {
    __brand: 'Connector',

    log,

    setAtom: setOrDelAtom,

    delAtom: (
      address: Address,
      context?: Context,
      newTimestamp?: Timestamp,
      oldTimestamp?: Timestamp,
    ) => setOrDelAtom(address, TOMB, context, newTimestamp, oldTimestamp),

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
