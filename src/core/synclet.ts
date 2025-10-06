import {
  Address,
  AnyAddress,
  AnyParentAddress,
  Atom,
  AtomAddress,
  AtomsAddress,
  Context,
  Data,
  LogLevel,
  Meta,
  SyncletImplementations,
  SyncletOptions,
  Timestamp,
  TimestampAddress,
  TimestampsAddress,
} from '@synclets/@types';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from '@synclets/connector/memory';
import {createMemoryTransport} from '@synclets/transport/memory';
import {getUniqueId, isTimestamp} from '@synclets/utils';
import {
  arrayDifference,
  arrayForEach,
  arrayMap,
  arrayPush,
  arrayReduce,
  isArray,
} from '../common/array.ts';
import {combineHash, getHash, Hash} from '../common/codec.ts';
import {getHlcFunctions} from '../common/hlc.ts';
import {
  objFreeze,
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
  isTimestampAndAtom,
  Message,
  ProtectedDataConnector,
  ProtectedMetaConnector,
  ProtectedSynclet,
  ProtectedTransport,
  TimestampAndAtom,
  type MessageNode,
  type MessageSubNodes,
} from './types.ts';

const VERSION = 1;

const ATTACH = 0;
const DETACH = 1;
const CONNECT = 2;
const DISCONNECT = 3;
const SEND_MESSAGE = 4;

export const createSynclet = async <
  Depth extends number,
  ProtectedDataConnectorType extends ProtectedDataConnector<Depth>,
  ProtectedMetaConnectorType extends ProtectedMetaConnector<Depth>,
>(
  {
    dataConnector = createMemoryDataConnector(1) as ProtectedDataConnectorType,
    metaConnector = createMemoryMetaConnector(
      dataConnector?.depth ?? 1,
    ) as ProtectedMetaConnectorType,
    transport = createMemoryTransport() as
      | ProtectedTransport
      | ProtectedTransport[],
  } = {},
  {
    onStart,
    onStop,
    onSync,
    onSetAtom,
    getSendContext,
    canReceiveMessage,
    canReadAtom,
    canWriteAtom,
    canRemoveAtom,
    filterChildIds,
  }: SyncletImplementations<Depth> = {},
  options: SyncletOptions = {},
): Promise<ProtectedSynclet<Depth>> => {
  const {
    depth: dataDepth,
    _: [
      dataAttach,
      dataDetach,
      dataReadAtom,
      dataWriteAtom,
      dataRemoveAtom,
      dataReadChildIds,
    ],
    $: [dataReadAtoms, dataGetData],
  } = dataConnector;
  const {
    depth: metaDepth,
    _: [
      metaAttach,
      metaDetach,
      metaReadTimestamp,
      metaWriteTimestamp,
      metaReadChildIds,
    ],
    $: [metaReadTimestamps, metaGetMeta],
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

  const isAnyParentAddress = (
    address: AnyAddress<Depth>,
  ): address is AnyParentAddress<Depth> => size(address) < dataDepth;

  const isAtomsOrTimestampsParentAddress = (
    address: AnyAddress<Depth>,
  ): address is AtomsAddress<Depth> & TimestampsAddress<Depth> =>
    size(address) == dataDepth - 1;

  const readAtoms = isUndefined(dataReadAtoms)
    ? async (address: AtomsAddress<Depth>, context: Context = {}) =>
        objFromEntries(
          await promiseAll(
            arrayMap(
              await readDataChildIds(address, context),
              async (childId) => [
                childId,
                await readAtom(
                  [...(address as Address), childId] as AtomAddress<Depth>,
                  context,
                ),
              ],
            ),
          ),
        )
    : dataReadAtoms;

  const readAtom = isUndefined(canReadAtom)
    ? dataReadAtom
    : async (address: AtomAddress<Depth>, context: Context = {}) =>
        (await canReadAtom(address, context))
          ? await dataReadAtom(address, context)
          : undefined;

  const writeAtom = isUndefined(canWriteAtom)
    ? dataWriteAtom
    : async (address: AtomAddress<Depth>, atom: Atom, context: Context = {}) =>
        (await canWriteAtom(address, atom, context))
          ? await dataWriteAtom(address, atom, context)
          : undefined;

  const removeAtom = isUndefined(canRemoveAtom)
    ? dataRemoveAtom
    : async (address: AtomAddress<Depth>, context: Context = {}) =>
        (await canRemoveAtom(address, context))
          ? await dataRemoveAtom(address, context)
          : undefined;

  const readDataChildIds = isUndefined(filterChildIds)
    ? dataReadChildIds
    : async (address: AnyParentAddress<Depth>, context: Context = {}) =>
        await filterChildIds(
          address,
          (await dataReadChildIds(address, context)) ?? [],
          context,
        );

  const readMetaChildIds = isUndefined(filterChildIds)
    ? metaReadChildIds
    : async (address: AnyParentAddress<Depth>, context: Context = {}) =>
        await filterChildIds(
          address,
          (await metaReadChildIds(address, context)) ?? [],
          context,
        );

  const readTimestamps = isUndefined(metaReadTimestamps)
    ? async (address: TimestampsAddress<Depth>, context: Context = {}) =>
        objFromEntries(
          await promiseAll(
            arrayMap(
              await readMetaChildIds(address, context),
              async (childId) => [
                childId,
                await metaReadTimestamp(
                  [...(address as Address), childId] as TimestampAddress<Depth>,
                  context,
                ),
              ],
            ),
          ),
        )
    : metaReadTimestamps;

  const setOrDelAtom = async (
    address: AtomAddress<Depth>,
    atomOrUndefined: Atom | undefined,
    context: Context = {},
    syncOrFromProtectedTransport: boolean | ProtectedTransport = true,
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
      async () => {
        await (isUndefined(atomOrUndefined)
          ? removeAtom(address, context)
          : writeAtom(address, atomOrUndefined, context));
        await metaWriteTimestamp(address, newTimestamp, context);
        await onSetAtom?.(address);
      },
    ];
    if (syncOrFromProtectedTransport) {
      arrayPush(tasks, () => syncExcept(address, syncOrFromProtectedTransport));
    }

    await queue(...tasks);
  };

  const getDataForAddress = async (
    address: AnyParentAddress<Depth> = [] as AnyParentAddress<Depth>,
  ): Promise<Data> => {
    return isAtomsOrTimestampsParentAddress(address)
      ? ((await readAtoms(address, {})) ?? {})
      : objFromEntries(
          await promiseAll(
            arrayMap(await readDataChildIds(address, {}), async (childId) => [
              childId,
              await getDataForAddress([
                ...(address as Address),
                childId,
              ] as AnyParentAddress<Depth>),
            ]),
          ),
        );
  };

  const getMetaForAddress = async (
    address: AnyParentAddress<Depth> = [] as AnyParentAddress<Depth>,
  ): Promise<Meta> =>
    isAtomsOrTimestampsParentAddress(address)
      ? ((await readTimestamps(address, {})) ?? {})
      : objFromEntries(
          await promiseAll(
            arrayMap(await readMetaChildIds(address, {}), async (childId) => [
              childId,
              await getMetaForAddress([
                ...(address as Address),
                childId,
              ] as AnyParentAddress<Depth>),
            ]),
          ),
        );

  const deriveHash = async (
    address: AnyParentAddress<Depth>,
    context: Context,
  ): Promise<Hash> =>
    arrayReduce(
      await promiseAll(
        arrayMap(
          (await readMetaChildIds(address, context)) ?? [],
          async (childId) =>
            isAtomsOrTimestampsParentAddress(address)
              ? getHash(
                  (await metaReadTimestamp(
                    [
                      ...(address as Address),
                      childId,
                    ] as TimestampAddress<Depth>,
                    context,
                  )) ?? '',
                )
              : await deriveHash(
                  [...(address as Address), childId] as AnyParentAddress<Depth>,
                  context,
                ),
        ),
      ),
      (previousHash, hash) => combineHash(previousHash, hash),
      0,
    );

  const readHashOrTimestamp = async (
    address: AnyAddress<Depth>,
    context: Context,
  ) =>
    isAnyParentAddress(address)
      ? ((await deriveHash(address, context)) ?? 0)
      : ((await metaReadTimestamp(address, context)) ?? EMPTY_STRING);

  const readFullNodesOrAtomAndTimestamp = async (
    address: AnyAddress<Depth>,
    context: Context,
  ): Promise<MessageSubNodes | TimestampAndAtom | undefined> => {
    if (isAnyParentAddress(address)) {
      return await readFullNodes(address, context);
    }
    const timestamp = await metaReadTimestamp(address, context);
    if (!isUndefined(timestamp)) {
      return [timestamp, await readAtom(address, context)];
    }
  };

  const readFullNodes = async (
    address: AnyParentAddress<Depth>,
    context: Context,
    except: string[] = [],
  ): Promise<MessageSubNodes> => {
    const subNodeObj: {[id: string]: MessageNode} = {};
    await promiseAll(
      arrayMap(
        arrayDifference(
          (await readMetaChildIds(address, context)) ?? [],
          except,
        ),
        async (id) =>
          ifNotUndefined(
            await readFullNodesOrAtomAndTimestamp(
              [...(address as Address), id] as AnyAddress<Depth>,
              context,
            ),
            (fullNodesOrAtomAndTimestamp) => {
              subNodeObj[id] = fullNodesOrAtomAndTimestamp;
            },
          ),
      ),
    );
    return [subNodeObj];
  };

  const syncExcept = async (
    address: AnyAddress<Depth>,
    exceptProtectedTransport?: ProtectedTransport | boolean,
  ) => {
    if (started) {
      const hashOrTimestamp = await readHashOrTimestamp(address, {});
      const tasks: Task[] = [];
      let didSync = false;
      arrayForEach(transports, (transport, t) => {
        if (transport !== exceptProtectedTransport) {
          log(`sync (${t}) ` + address);
          didSync = true;
          arrayPush(tasks, () =>
            sendMessage(transport, address, hashOrTimestamp),
          );
        }
      });
      if (didSync) {
        await onSync?.(address);
      }
      await queue(...tasks);
    }
  };

  const sendMessage = async (
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

      await transformNode(
        transport,
        address as AnyAddress<Depth>,
        node,
        context,
        (newNode) => sendMessage(transport, address, newNode, context, from),
      );
    });

  const transformNode = async (
    transport: ProtectedTransport,
    address: AnyAddress<Depth>,
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
    address: TimestampAddress<Depth>,
    otherTimestamp: Timestamp,
    context: Context,
  ): Promise<MessageNode | undefined> => {
    if (size(address) == dataDepth) {
      const myTimestamp =
        (await metaReadTimestamp(address, context)) ?? EMPTY_STRING;
      if (otherTimestamp > myTimestamp) {
        return myTimestamp;
      } else if (otherTimestamp < myTimestamp) {
        return [myTimestamp, await readAtom(address, context)];
      }
    } else {
      log(INVALID_NODE + ' Timestamp vs SubNodes: ' + address, WARN);
    }
  };

  const transformTimestampAndAtom = async (
    transport: ProtectedTransport,
    address: TimestampAddress<Depth>,
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
        return [myTimestamp, await readAtom(address, context)];
      }
    } else {
      log(INVALID_NODE + ' TimestampAtom vs SubNodes: ' + address, WARN);
    }
  };

  const transformHash = async (
    _transport: ProtectedTransport,
    address: AnyParentAddress<Depth>,
    otherHash: Hash,
    context: Context,
  ): Promise<MessageNode | undefined> => {
    if (size(address) < dataDepth) {
      if (otherHash !== (await deriveHash(address, context))) {
        const subNodeObj: {[id: string]: MessageNode} = {};
        await promiseAll(
          arrayMap(
            (await readMetaChildIds(address, context)) ?? [],
            async (id) => {
              subNodeObj[id] = await readHashOrTimestamp(
                [...(address as Address), id] as AnyAddress<Depth>,
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
    address: AnyParentAddress<Depth>,
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
            [...(address as Address), id] as AnyAddress<Depth>,
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
      await onStart?.();
      await sync([] as AnyAddress<Depth>);
    }
  };

  const stop = async () => {
    if (started) {
      log('stop');
      await promiseAll(
        arrayMap(transports, (transport) => transport._[DISCONNECT]()),
      );
      started = false;
      await onStop?.();
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

  const sync = (address: AnyAddress<Depth>) => syncExcept(address);

  const setAtom = (
    address: AtomAddress<Depth>,
    atom: Atom,
    context?: Context,
    sync?: boolean,
  ) => setOrDelAtom(address, atom, context, sync);

  const delAtom = (
    address: AtomAddress<Depth>,
    context?: Context,
    sync?: boolean,
  ) => setOrDelAtom(address, undefined, context, sync);

  const getData = async () =>
    (await dataGetData?.()) ?? (((await getDataForAddress()) ?? {}) as Data);

  const getMeta = async () =>
    (await metaGetMeta?.()) ?? (((await getMetaForAddress()) ?? {}) as Meta);

  const synclet: ProtectedSynclet<Depth> = {
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

  return objFreeze(synclet);
};
