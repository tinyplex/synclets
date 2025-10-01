import {
  Address,
  Atom,
  Context,
  createSynclet as createSyncletDecl,
  Data,
  Hash,
  LogLevel,
  Meta,
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
  arrayReduce,
  isArray,
} from '../common/array.ts';
import {combineHash, getHash} from '../common/codec.ts';
import {getHlcFunctions} from '../common/hlc.ts';
import {
  objFromEntries,
  objKeys,
  objNotEmpty,
  objToArray,
} from '../common/object.ts';
import {
  errorNew,
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
  Message,
  ProtectedDataConnector,
  ProtectedMetaConnector,
  ProtectedSynclet,
  ProtectedTransport,
  type MessageNode,
  type MessageSubNodes,
} from './types.ts';

const VERSION = 1;

const ATTACH = 0;
const DETACH = 1;
const CONNECT = 2;
const DISCONNECT = 3;
const SEND_MESSAGE = 4;

export const createSynclet: typeof createSyncletDecl = (async (
  dataConnector: ProtectedDataConnector,
  metaConnector: ProtectedMetaConnector,
  transport: ProtectedTransport | ProtectedTransport[],
  {canReceiveMessage, getSendContext}: SyncletImplementations = {},
  options: SyncletOptions = {},
): Promise<ProtectedSynclet> => {
  const {
    _: [
      dataDepth,
      dataAttach,
      dataDetach,
      dataReadAtom,
      dataWriteAtom,
      dataRemoveAtom,
      dataReadChildIds,
      dataReadAtoms,
    ],
    $: [dataGetData],
  } = dataConnector;
  const {
    _: [
      metaDepth,
      metaAttach,
      metaDetach,
      metaReadTimestamp,
      metaWriteTimestamp,
      metaReadChildIds,
      metaReadTimestamps,
    ],
    $: [metaGetMeta],
  } = metaConnector;

  if (dataDepth < 1 || metaDepth < 1 || dataDepth != metaDepth) {
    errorNew('depths must be positive and equal');
  }

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

  const [getNextTimestamp, seenTimestamp] = getHlcFunctions(id);

  const setOrDelAtom = async (
    address: Address,
    atomOrUndefined: Atom | undefined,
    context: Context = {},
    syncOrFromTransport: boolean | ProtectedTransport = true,
    newTimestamp?: Timestamp,
    oldTimestamp?: Timestamp,
  ) => {
    log(`set ${address} ${atomOrUndefined}`);
    if (isUndefined(newTimestamp)) {
      newTimestamp = getNextTimestamp();
    } else {
      seenTimestamp(newTimestamp);
    }
    if (isUndefined(oldTimestamp)) {
      oldTimestamp = await metaReadTimestamp(address, context);
    }
    const tasks = [
      isUndefined(atomOrUndefined)
        ? () => dataRemoveAtom(address, context)
        : () => dataWriteAtom(address, atomOrUndefined, context),
      () => metaWriteTimestamp(address, newTimestamp, context),
    ];
    if (syncOrFromTransport) {
      arrayPush(tasks, () => syncExcept(address, syncOrFromTransport));
    }

    await queue(...tasks);
  };

  const getDataForAddress = async (address: Address): Promise<Data> =>
    size(address) == dataDepth
      ? ((await dataReadAtoms(address, {})) ?? {})
      : objFromEntries(
          await promiseAll(
            arrayMap(await dataReadChildIds(address, {}), async (childId) => [
              childId,
              await getDataForAddress([...address, childId]),
            ]),
          ),
        );

  const getMetaForAddress = async (address: Address): Promise<Meta> =>
    size(address) == dataDepth
      ? ((await metaReadTimestamps(address, {})) ?? {})
      : objFromEntries(
          await promiseAll(
            arrayMap(await metaReadChildIds(address, {}), async (childId) => [
              childId,
              await getMetaForAddress([...address, childId]),
            ]),
          ),
        );

  const deriveHash = async (
    address: Address,
    context: Context,
  ): Promise<Hash> =>
    arrayReduce(
      await promiseAll(
        arrayMap(
          (await metaReadChildIds(address, context)) ?? [],
          async (childId) =>
            size(address) == metaDepth - 1
              ? getHash(
                  (await metaReadTimestamp([...address, childId], context)) ??
                    '',
                )
              : await deriveHash([...address, childId], context),
        ),
      ),
      (previousHash, hash) => combineHash(previousHash, hash),
      0,
    );

  const readHashOrTimestamp = async (address: Address, context: Context) =>
    size(address) < dataDepth
      ? ((await deriveHash(address, context)) ?? 0)
      : ((await metaReadTimestamp(address, context)) ?? EMPTY_STRING);

  const readFullNodesOrAtomAndTimestamp = async (
    address: Address,
    context: Context,
  ): Promise<MessageSubNodes | TimestampAndAtom | undefined> => {
    if (size(address) < dataDepth) {
      return await readFullNodes(address, context);
    }
    const timestamp = await metaReadTimestamp(address, context);
    if (!isUndefined(timestamp)) {
      return [timestamp, await dataReadAtom(address, context)];
    }
  };

  const readFullNodes = async (
    address: Address,
    context: Context,
    except: string[] = [],
  ): Promise<MessageSubNodes> => {
    const subNodeObj: {[id: string]: MessageNode} = {};
    await promiseAll(
      arrayMap(
        arrayDifference(
          (await metaReadChildIds(address, context)) ?? [],
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

  const syncExcept = async (
    address: Address,
    exceptTransport?: ProtectedTransport | boolean,
  ) => {
    if (started) {
      const hashOrTimestamp = await readHashOrTimestamp(address, {});
      const tasks: Task[] = [];
      arrayForEach(transports, (transport, t) => {
        if (transport !== exceptTransport) {
          log(`sync (${t}) ` + address);
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
    node: MessageNode,
    receivedContext: Context = {},
    to?: string,
  ) =>
    await transport._[SEND_MESSAGE](
      [
        VERSION,
        0,
        dataDepth,
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
      if (depth != dataDepth) {
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
    node: MessageNode,
    context: Context,
    ifTransformedToDefined: (newNode: MessageNode) => Promise<void> | void,
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
  ): Promise<MessageNode | undefined> => {
    if (size(address) == dataDepth) {
      const myTimestamp =
        (await metaReadTimestamp(address, context)) ?? EMPTY_STRING;
      if (otherTimestamp > myTimestamp) {
        return myTimestamp;
      } else if (otherTimestamp < myTimestamp) {
        return [myTimestamp, await dataReadAtom(address, context)];
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
  ): Promise<MessageNode | undefined> => {
    if (size(address) == dataDepth) {
      const myTimestamp =
        (await metaReadTimestamp(address, context)) ?? EMPTY_STRING;
      const [otherTimestamp, otherAtom] = otherTimestampAndAtom;
      if (otherTimestamp > myTimestamp) {
        await setOrDelAtom(
          address,
          otherAtom,
          context,
          transport,
          otherTimestamp,
          myTimestamp,
        );
      } else if (otherTimestamp < myTimestamp) {
        return [myTimestamp, await dataReadAtom(address, context)];
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
  ): Promise<MessageNode | undefined> => {
    if (size(address) < dataDepth) {
      if (otherHash !== (await deriveHash(address, context))) {
        const subNodeObj: {[id: string]: MessageNode} = {};
        await promiseAll(
          arrayMap(
            (await metaReadChildIds(address, context)) ?? [],
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
    [otherSubNodeObj, partial]: MessageSubNodes,
    context: Context,
  ): Promise<MessageNode | undefined> => {
    if (size(address) < dataDepth) {
      const mySubNodes: MessageSubNodes = partial
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

  // --

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[${id}] ${string}`);

  const start = async () => {
    if (!started) {
      log('start');
      await promiseAll(
        arrayMap(transports, (transport) =>
          transport._[CONNECT]((message: Message, from: string) =>
            receiveMessage(transport, message, from),
          ),
        ),
      );
      started = true;
      await sync([]);
    }
  };

  const stop = async () => {
    if (started) {
      log('stop');
      await promiseAll(
        arrayMap(transports, (transport) => transport._[DISCONNECT]()),
      );
      started = false;
    }
  };

  const isStarted = () => started;

  const destroy = async () => {
    log('destroy');
    await synclet.stop();
    await dataDetach();
    await metaDetach();
    arrayForEach(transports, (transport) => transport._[DETACH]());
  };

  const getDataConnector = () => dataConnector;

  const getMetaConnector = () => metaConnector;

  const getTransport = () => [...transports];

  const sync = (address: Address) => syncExcept(address);

  const setAtom = (
    address: Address,
    atom: Atom,
    context?: Context,
    sync?: boolean,
  ) => setOrDelAtom(address, atom, context, sync);

  const delAtom = (address: Address, context?: Context, sync?: boolean) =>
    setOrDelAtom(address, undefined, context, sync);

  const getData = async () =>
    (await dataGetData?.()) ?? (((await getDataForAddress([])) ?? {}) as Data);

  const getMeta = async () =>
    (await metaGetMeta?.()) ?? (((await getMetaForAddress([])) ?? {}) as Meta);

  const synclet: ProtectedSynclet = {
    log,
    start,
    stop,
    isStarted,
    destroy,
    getDataConnector,
    getMetaConnector,
    getTransport,
    sync,
    setAtom,
    delAtom,
    getData,
    getMeta,
    _: [syncExcept],
  };

  await dataAttach(synclet);
  await metaAttach(synclet);
  arrayForEach(transports, (transport) => transport._[ATTACH](synclet));

  return synclet;
}) as any;
