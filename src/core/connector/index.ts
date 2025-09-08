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
  combineHash,
  errorNew,
  getHash,
  getHlcFunctions,
  isEmpty,
  isUndefined,
} from '@synclets/utils';
import type {ProtectedConnector} from '../protected.d.ts';
import {getQueueFunctions} from '../queue.ts';

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
    isParent,
    readAtomIds,
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

  const connector = {
    __brand: 'Connector',

    log,

    setAtom: async (
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
    readAtomIds,
  } as const;

  return connector;
};
