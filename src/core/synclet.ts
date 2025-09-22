import {
  Address,
  Context,
  createSynclet as createSyncletDecl,
  Hash,
  LogLevel,
  ProtocolNode,
  ProtocolSubNodes,
  Synclet,
  SyncletImplementations,
  SyncletOptions,
  Timestamp,
  TimestampAndAtom,
} from '@synclets/@types';
import {getUniqueId} from '@synclets/utils';
import {arrayDifference, arrayMap} from '../common/array.ts';
import {objKeys, objNotEmpty, objToArray} from '../common/object.ts';
import {
  ifNotUndefined,
  isUndefined,
  promiseAll,
  size,
} from '../common/other.ts';
import {getQueueFunctions} from '../common/queue.ts';
import {ASTERISK, EMPTY_STRING} from '../common/string.ts';
import {
  isHash,
  isProtocolSubNodes,
  isTimestamp,
  isTimestampAndAtom,
} from '../common/types.ts';
import {Message, ProtectedConnector, ProtectedTransport} from './types.js';

const INVALID_NODE = 'invalid node';

export const createSynclet: typeof createSyncletDecl = (async (
  connector: ProtectedConnector,
  transport: ProtectedTransport,
  {canReceiveMessage, getSendContext}: SyncletImplementations = {},
  options: SyncletOptions = {},
): Promise<Synclet> => {
  let started = false;
  const id = options.id ?? getUniqueId();
  const logger = options.logger ?? {};
  const [queue] = getQueueFunctions();

  const queueIfStarted = async (actions: () => Promise<void>) => {
    if (started) {
      await queue(actions);
    }
  };

  const readHashOrTimestamp = async (address: Address, context: Context) =>
    size(address) < connector.atomDepth
      ? ((await connector.readHash(address, context)) ?? 0)
      : ((await connector.readTimestamp(address, context)) ?? EMPTY_STRING);

  const readFullNodesOrAtomAndTimestamp = async (
    address: Address,
    context: Context,
  ): Promise<ProtocolSubNodes | TimestampAndAtom | undefined> => {
    if (size(address) < connector.atomDepth) {
      return await readFullNodes(address, context);
    }
    const timestamp = await connector.readTimestamp(address, context);
    if (!isUndefined(timestamp)) {
      return [timestamp, await connector.readAtom(address, context)];
    }
  };

  const readFullNodes = async (
    address: Address,
    context: Context,
    except: string[] = [],
  ): Promise<ProtocolSubNodes> => {
    const subNodeObj: {[id: string]: ProtocolNode} = {};
    await promiseAll(
      arrayMap(
        arrayDifference(
          (await connector.readChildIds(address, context)) ?? [],
          except,
        ),
        async (id) =>
          ifNotUndefined(
            await readFullNodesOrAtomAndTimestamp([...address, id], context),
            (fullNodesOrAtomAndTimestamp) => {
              subNodeObj[id] = fullNodesOrAtomAndTimestamp;
            },
          ),
      ),
    );
    return [subNodeObj];
  };

  const sync = (address: Address) =>
    queueIfStarted(async () => {
      log(`sync ${address}`);
      await sendNodeMessage(address, await readHashOrTimestamp(address, {}));
    });

  const sendNodeMessage = async (
    address: Address,
    node: ProtocolNode,
    receivedContext: Context = {},
    to?: string,
  ) =>
    await transport.sendMessage(
      [0, address, node, (await getSendContext?.(receivedContext)) ?? {}],
      to,
    );

  const receiveMessage = (message: Message, from: string) =>
    queueIfStarted(async () => {
      const [type, address, node, context] = message;

      if (from == ASTERISK || from == id || type != 0) {
        return log(`invalid message: ${from}`, 'warn');
      }

      if (
        !isUndefined(canReceiveMessage) &&
        !(await canReceiveMessage(context))
      ) {
        return log(`can't receive message: ${from}`, 'warn');
      }

      await transformNode(address, node, context, (newNode) =>
        sendNodeMessage(address, newNode, context, from),
      );
    });

  const transformNode = async (
    address: Address,
    node: ProtocolNode,
    context: Context,
    ifTransformedToDefined: (newNode: ProtocolNode) => Promise<void> | void,
    ifTransformedToUndefined: () => void = () => {},
  ) =>
    await ifNotUndefined(
      await (
        (isTimestamp(node)
          ? transformTimestamp
          : isTimestampAndAtom(node)
            ? transformTimestampAndAtom
            : isHash(node)
              ? transformHash
              : isProtocolSubNodes(node)
                ? transformSubNodes
                : () => log(`${INVALID_NODE}: ${address}`, 'warn')) as any
      )?.(address, node, context),
      ifTransformedToDefined,
      ifTransformedToUndefined,
    );

  const transformTimestamp = async (
    address: Address,
    otherTimestamp: Timestamp,
    context: Context,
  ): Promise<ProtocolNode | undefined> => {
    if (size(address) == connector.atomDepth) {
      const myTimestamp =
        (await connector.readTimestamp(address, context)) ?? EMPTY_STRING;
      if (otherTimestamp > myTimestamp) {
        return myTimestamp;
      } else if (otherTimestamp < myTimestamp) {
        return [myTimestamp, await connector.readAtom(address, context)];
      }
    } else {
      log(`${INVALID_NODE}; Timestamp vs SubNodes: ${address}`, 'warn');
    }
  };

  const transformTimestampAndAtom = async (
    address: Address,
    otherTimestampAndAtom: TimestampAndAtom,
    context: Context,
  ): Promise<ProtocolNode | undefined> => {
    if (size(address) == connector.atomDepth) {
      const myTimestamp =
        (await connector.readTimestamp(address, context)) ?? EMPTY_STRING;
      const [otherTimestamp, otherAtom] = otherTimestampAndAtom;
      if (otherTimestamp > myTimestamp) {
        await connector.setOrDelAtom(
          address,
          otherAtom,
          context,
          synclet,
          otherTimestamp,
          myTimestamp,
        );
      } else if (otherTimestamp < myTimestamp) {
        return [myTimestamp, await connector.readAtom(address, context)];
      }
    } else {
      log(`${INVALID_NODE}; TimestampAtom vs SubNodes: ${address}`, 'warn');
    }
  };

  const transformHash = async (
    address: Address,
    otherHash: Hash,
    context: Context,
  ): Promise<ProtocolNode | undefined> => {
    if (size(address) < connector.atomDepth) {
      if (otherHash !== (await connector.readHash(address, context))) {
        const subNodeObj: {[id: string]: ProtocolNode} = {};
        await promiseAll(
          arrayMap(
            (await connector.readChildIds(address, context)) ?? [],
            async (id) => {
              subNodeObj[id] = await readHashOrTimestamp(
                [...address, id],
                context,
              );
            },
          ),
        );
        return [subNodeObj];
      }
    } else {
      log(`${INVALID_NODE}; Hash vs no SubNodes: ${address}`, 'warn');
    }
  };

  const transformSubNodes = async (
    address: Address,
    [otherSubNodeObj, partial]: ProtocolSubNodes,
    context: Context,
  ): Promise<ProtocolNode | undefined> => {
    if (size(address) < connector.atomDepth) {
      const mySubNodes: ProtocolSubNodes = partial
        ? [{}]
        : await readFullNodes(address, context, objKeys(otherSubNodeObj));
      await promiseAll(
        objToArray(otherSubNodeObj, (id, otherSubNode) =>
          transformNode(
            [...address, id],
            otherSubNode,
            context,
            (newNode) => {
              mySubNodes[0][id] = newNode;
            },
            () => {
              mySubNodes[1] = 1;
            },
          ),
        ),
      );
      if (objNotEmpty(mySubNodes[0])) {
        return mySubNodes;
      }
    } else {
      log(`${INVALID_NODE}; SubNodes vs no SubNodes: ${address}`, 'warn');
    }
  };

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[${id}] ${string}`);

  const synclet: Synclet = {
    log,

    start: async () => {
      if (!started) {
        log('start');
        await connector.connect();
        await transport.connect(receiveMessage);
        started = true;
        await sync([]);
      }
    },

    stop: async () => {
      if (started) {
        log('stop');
        started = false;
        await connector.disconnect();
        await transport.disconnect();
      }
    },

    isStarted: () => started,

    sync,
  };

  connector.bind(synclet, id);
  transport.bind(synclet, id);
  return synclet;
}) as any;
