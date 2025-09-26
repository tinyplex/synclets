import {
  Address,
  Context,
  createSynclet as createSyncletDecl,
  Hash,
  LogLevel,
  ProtocolNode,
  ProtocolSubNodes,
  SyncletImplementations,
  SyncletOptions,
  Timestamp,
  TimestampAndAtom,
} from '@synclets/@types';
import {getUniqueId} from '@synclets/utils';
import {
  arrayDifference,
  arrayForEach,
  arrayMap,
  arrayPush,
  isArray,
} from '../common/array.ts';
import {objKeys, objNotEmpty, objToArray} from '../common/object.ts';
import {
  ifNotUndefined,
  isUndefined,
  promiseAll,
  size,
} from '../common/other.ts';
import {getQueueFunctions, Task} from '../common/queue.ts';
import {
  ASTERISK,
  EMPTY_STRING,
  INVALID,
  INVALID_NODE,
  WARN,
} from '../common/string.ts';
import {
  isHash,
  isProtocolSubNodes,
  isTimestamp,
  isTimestampAndAtom,
} from '../common/types.ts';
import {
  Message,
  ProtectedConnector,
  ProtectedSynclet,
  ProtectedTransport,
} from './types.js';

const VERSION = 1;

export const createSynclet: typeof createSyncletDecl = (async (
  {
    connect: connectorConnect,
    disconnect: connectorDisconnect,
    _: [
      connectorDepth,
      connectorBind,
      connectorReadAtom,
      connectorReadTimestamp,
      connectorReadHash,
      connectorReadChildIds,
      connectorSetOrDelAtom,
    ],
  }: ProtectedConnector,
  transport: ProtectedTransport | ProtectedTransport[],
  {canReceiveMessage, getSendContext}: SyncletImplementations = {},
  options: SyncletOptions = {},
): Promise<ProtectedSynclet> => {
  let started = false;
  const id = options.id ?? getUniqueId();
  const logger = options.logger ?? {};
  const [queue] = getQueueFunctions();

  const queueIfStarted = async (actions: () => Promise<void>) => {
    if (started) {
      await queue(actions);
    }
  };

  const transports = isArray(transport) ? transport : [transport];

  const readHashOrTimestamp = async (address: Address, context: Context) =>
    size(address) < connectorDepth
      ? ((await connectorReadHash(address, context)) ?? 0)
      : ((await connectorReadTimestamp(address, context)) ?? EMPTY_STRING);

  const readFullNodesOrAtomAndTimestamp = async (
    address: Address,
    context: Context,
  ): Promise<ProtocolSubNodes | TimestampAndAtom | undefined> => {
    if (size(address) < connectorDepth) {
      return await readFullNodes(address, context);
    }
    const timestamp = await connectorReadTimestamp(address, context);
    if (!isUndefined(timestamp)) {
      return [timestamp, await connectorReadAtom(address, context)];
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
          (await connectorReadChildIds(address, context)) ?? [],
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

  const sync = (address: Address) => syncExcept(address);

  const syncExcept = async (
    address: Address,
    exceptTransport?: ProtectedTransport,
  ) => {
    if (started) {
      log(`sync ` + address);
      const hashOrTimestamp = await readHashOrTimestamp(address, {});
      const tasks: Task[] = [];
      arrayForEach(transports, (transport) => {
        if (transport !== exceptTransport) {
          arrayPush(tasks, () =>
            sendNodeMessage(transport, address, hashOrTimestamp),
          );
        }
      });
      await queue(...tasks);
    }
  };

  const sendNodeMessage = async (
    transport: ProtectedTransport,
    address: Address,
    node: ProtocolNode,
    receivedContext: Context = {},
    to?: string,
  ) =>
    await transport._[3](
      [
        VERSION,
        0,
        connectorDepth,
        address,
        node,
        (await getSendContext?.(receivedContext)) ?? {},
      ],
      to,
    );

  const receiveMessage = (
    transport: ProtectedTransport,
    message: Message,
    from: string,
  ) =>
    queueIfStarted(async () => {
      const [version, type, depth, address, node, context] = message;

      if (from == ASTERISK || from == id) {
        return log(INVALID + 'from: ' + from, WARN);
      }
      if (version != VERSION) {
        return log(INVALID + 'version: ' + version, WARN);
      }
      if (type != 0) {
        return log(INVALID + 'type: ' + type, WARN);
      }
      if (depth != connectorDepth) {
        return log(INVALID + 'depth: ' + depth, WARN);
      }
      if (
        !isUndefined(canReceiveMessage) &&
        !(await canReceiveMessage(context))
      ) {
        return log(`can't receive message: ${from}`, WARN);
      }

      await transformNode(transport, address, node, context, (newNode) =>
        sendNodeMessage(transport, address, newNode, context, from),
      );
    });

  const transformNode = async (
    transport: ProtectedTransport,
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
                : () => log(INVALID_NODE + ' ' + address, WARN)) as any
      )?.(transport, address, node, context),
      ifTransformedToDefined,
      ifTransformedToUndefined,
    );

  const transformTimestamp = async (
    _transport: ProtectedTransport,
    address: Address,
    otherTimestamp: Timestamp,
    context: Context,
  ): Promise<ProtocolNode | undefined> => {
    if (size(address) == connectorDepth) {
      const myTimestamp =
        (await connectorReadTimestamp(address, context)) ?? EMPTY_STRING;
      if (otherTimestamp > myTimestamp) {
        return myTimestamp;
      } else if (otherTimestamp < myTimestamp) {
        return [myTimestamp, await connectorReadAtom(address, context)];
      }
    } else {
      log(INVALID_NODE + ' Timestamp vs SubNodes: ' + address, WARN);
    }
  };

  const transformTimestampAndAtom = async (
    transport: ProtectedTransport,
    address: Address,
    otherTimestampAndAtom: TimestampAndAtom,
    context: Context,
  ): Promise<ProtocolNode | undefined> => {
    if (size(address) == connectorDepth) {
      const myTimestamp =
        (await connectorReadTimestamp(address, context)) ?? EMPTY_STRING;
      const [otherTimestamp, otherAtom] = otherTimestampAndAtom;
      if (otherTimestamp > myTimestamp) {
        await connectorSetOrDelAtom(
          address,
          otherAtom,
          context,
          transport,
          otherTimestamp,
          myTimestamp,
        );
      } else if (otherTimestamp < myTimestamp) {
        return [myTimestamp, await connectorReadAtom(address, context)];
      }
    } else {
      log(INVALID_NODE + ' TimestampAtom vs SubNodes: ' + address, WARN);
    }
  };

  const transformHash = async (
    _transport: ProtectedTransport,
    address: Address,
    otherHash: Hash,
    context: Context,
  ): Promise<ProtocolNode | undefined> => {
    if (size(address) < connectorDepth) {
      if (otherHash !== (await connectorReadHash(address, context))) {
        const subNodeObj: {[id: string]: ProtocolNode} = {};
        await promiseAll(
          arrayMap(
            (await connectorReadChildIds(address, context)) ?? [],
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
      log(INVALID_NODE + ' Hash vs no SubNodes: ' + address, WARN);
    }
  };

  const transformSubNodes = async (
    transport: ProtectedTransport,
    address: Address,
    [otherSubNodeObj, partial]: ProtocolSubNodes,
    context: Context,
  ): Promise<ProtocolNode | undefined> => {
    if (size(address) < connectorDepth) {
      const mySubNodes: ProtocolSubNodes = partial
        ? [{}]
        : await readFullNodes(address, context, objKeys(otherSubNodeObj));
      await promiseAll(
        objToArray(otherSubNodeObj, (id, otherSubNode) =>
          transformNode(
            transport,
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
      log(INVALID_NODE + ' SubNodes vs no SubNodes: ' + address, WARN);
    }
  };

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[${id}] ${string}`);

  const synclet: ProtectedSynclet = {
    log,

    start: async () => {
      if (!started) {
        log('start');
        await connectorConnect();
        await promiseAll(
          arrayMap(transports, (transport) =>
            transport._[1]((message: Message, from: string) =>
              receiveMessage(transport, message, from),
            ),
          ),
        );
        started = true;
        await sync([]);
      }
    },

    stop: async () => {
      if (started) {
        log('stop');
        started = false;
        await connectorDisconnect();
        await promiseAll(arrayMap(transports, (transport) => transport._[2]()));
      }
    },

    isStarted: () => started,

    sync,

    _: [syncExcept],
  };

  connectorBind(synclet, id);
  arrayForEach(transports, (transport) => transport._[0](synclet, id));

  return synclet;
}) as any;
