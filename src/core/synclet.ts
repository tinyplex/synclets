import {
  Address,
  AnyAddress,
  AnyParentAddress,
  Atom,
  AtomAddress,
  AtomsAddress,
  Context,
  createSynclet as createSyncletDecl,
  Data,
  Hash,
  LogLevel,
  Message,
  MessageNode,
  MessageNodes,
  Meta,
  SyncletComponents,
  SyncletImplementations,
  SyncletOptions,
  Timestamp,
  TimestampAddress,
  TimestampAndAtom,
  TimestampsAddress,
} from '@synclets/@types';
import {getHash, getUniqueId, isTimestamp} from '@synclets/utils';
import {
  arrayDifference,
  arrayForEach,
  arrayMap,
  arrayPush,
  arrayReduce,
  isArray,
} from '../common/array.ts';
import {combineHash} from '../common/codec.ts';
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
  getEmptyObject,
  getVoid,
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
import type {
  ProtectedDataConnector,
  ProtectedMetaConnector,
  ProtectedSynclet,
  ProtectedTransport,
} from './types.ts';
import {isHash, isProtocolSubNodes, isTimestampAndAtom} from './types.ts';

const VERSION = 1;

const ATTACH = 0;
const DETACH = 1;
const SEND_MESSAGE = 2;

export const createSynclet: typeof createSyncletDecl = (async <
  Depth extends number,
  ProtectedDataConnectorType extends ProtectedDataConnector<Depth>,
  ProtectedMetaConnectorType extends ProtectedMetaConnector<Depth>,
>(
  {
    dataConnector,
    metaConnector,
    transport,
  }: SyncletComponents<
    Depth,
    ProtectedDataConnectorType,
    ProtectedMetaConnectorType
  > & {
    transport?: ProtectedTransport | ProtectedTransport[];
  } = {},
  {
    onStart,
    onStop,
    onSync,
    onSendMessage,
    onReceiveMessage,
    onSetAtom,
    getSendContext,
    canReceiveMessage,
    canReadAtom,
    canWriteAtom,
    canRemoveAtom,
    filterChildIds,
    getNow,
  }: SyncletImplementations<Depth> = {},
  options: SyncletOptions = {},
): Promise<ProtectedSynclet<Depth>> => {
  const {
    depth: dataDepth = 1,
    _: [
      dataAttach,
      dataDetach,
      dataReadAtom,
      dataWriteAtom,
      dataRemoveAtom,
      dataReadChildIds,
    ] = [],
    $: [dataReadAtoms, dataGetData] = [],
  } = dataConnector ?? {};
  const {
    depth: metaDepth = 1,
    _: [
      metaAttach,
      metaDetach,
      metaReadTimestamp,
      metaWriteTimestamp,
      metaReadChildIds,
    ] = [],
    $: [metaReadTimestamps, metaGetMeta] = [],
  } = metaConnector ?? {};
  const hasConnectors = dataAttach && metaAttach;

  if (!!dataAttach != !!metaAttach) {
    errorNew('both connectors must be provided, or both omitted');
  }
  if (dataDepth! < 1 || metaDepth! < 1 || dataDepth != metaDepth) {
    errorNew(`depths must be positive and equal; ${dataDepth} vs ${metaDepth}`);
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

  const transports = (
    isArray(transport) ? transport : transport ? [transport] : []
  ) as ProtectedTransport[];

  const [getNextTimestamp, seenTimestamp] = getHlcFunctions(id, getNow);

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
    : (address: AtomsAddress<Depth>) => dataReadAtoms(address);

  const readAtom = isUndefined(canReadAtom)
    ? (address: AtomAddress<Depth>) => dataReadAtom!(address)
    : async (address: AtomAddress<Depth>, context: Context = {}) =>
        (await canReadAtom(address, context))
          ? await dataReadAtom!(address)
          : undefined;

  const writeAtom = isUndefined(canWriteAtom)
    ? (address: AtomAddress<Depth>, atom: Atom) => dataWriteAtom!(address, atom)
    : async (address: AtomAddress<Depth>, atom: Atom, context: Context = {}) =>
        (await canWriteAtom(address, atom, context))
          ? await dataWriteAtom!(address, atom)
          : undefined;

  const removeAtom = isUndefined(canRemoveAtom)
    ? (address: AtomAddress<Depth>) => dataRemoveAtom!(address)
    : async (address: AtomAddress<Depth>, context: Context = {}) =>
        (await canRemoveAtom(address, context))
          ? await dataRemoveAtom!(address)
          : undefined;

  const readDataChildIds = isUndefined(filterChildIds)
    ? (address: AnyParentAddress<Depth>) => dataReadChildIds!(address)
    : async (address: AnyParentAddress<Depth>, context: Context = {}) =>
        await filterChildIds(
          address,
          (await dataReadChildIds!(address)) ?? [],
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
                await metaReadTimestamp!([
                  ...(address as Address),
                  childId,
                ] as TimestampAddress<Depth>),
              ],
            ),
          ),
        )
    : metaReadTimestamps!;

  const readMetaChildIds = isUndefined(filterChildIds)
    ? (address: AnyParentAddress<Depth>) => metaReadChildIds!(address)
    : async (address: AnyParentAddress<Depth>, context: Context = {}) =>
        await filterChildIds(
          address,
          (await metaReadChildIds!(address)) ?? [],
          context,
        );

  const setOrDelAtom = hasConnectors
    ? async (
        address: AtomAddress<Depth>,
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
          oldTimestamp = await metaReadTimestamp!(address);
        }
        const tasks = [
          async () => {
            await (isUndefined(atomOrUndefined)
              ? removeAtom(address, context)
              : writeAtom(address, atomOrUndefined, context));
            await metaWriteTimestamp!(address, newTimestamp);
            await onSetAtom?.(address);
          },
        ];
        if (syncOrFromTransport) {
          arrayPush(tasks, () =>
            syncExceptTransport(syncOrFromTransport, address),
          );
        }

        await queue(...tasks);
      }
    : getVoid;

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
                  (await metaReadTimestamp!([
                    ...(address as Address),
                    childId,
                  ] as TimestampAddress<Depth>)) ?? '',
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
      : ((await metaReadTimestamp!(address)) ?? EMPTY_STRING);

  const readFullNodesOrAtomAndTimestamp = async (
    address: AnyAddress<Depth>,
    context: Context,
  ): Promise<MessageNodes | TimestampAndAtom | undefined> => {
    if (isAnyParentAddress(address)) {
      return await readFullNodes(address, context);
    }
    const timestamp = await metaReadTimestamp!(address);
    if (!isUndefined(timestamp)) {
      return [timestamp, await readAtom(address, context)];
    }
  };

  const readFullNodes = async (
    address: AnyParentAddress<Depth>,
    context: Context,
    except: string[] = [],
  ): Promise<MessageNodes> => {
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

  const syncExceptTransport = async (
    syncOrFromTransport: boolean | ProtectedTransport,
    ...addresses: AnyAddress<Depth>[]
  ) => {
    if (started) {
      const hashOrTimestamp = await readHashOrTimestamp(addresses[0], {});
      const tasks: Task[] = [];
      let didSync = false;
      arrayForEach(transports, (transport, t) => {
        if (transport !== syncOrFromTransport) {
          log(`sync (${t}) ` + addresses[0]);
          didSync = true;
          arrayPush(tasks, () =>
            sendMessage(transport, addresses[0], hashOrTimestamp),
          );
        }
      });
      if (didSync) {
        await onSync?.(addresses[0]);
      }
      await queue(...tasks);
    }
  };

  const syncChangedAtoms = async (...addresses: AtomAddress<Depth>[]) => {
    await promiseAll(
      arrayMap(addresses, async (address) => {
        if (size(address) == dataDepth!) {
          await metaWriteTimestamp!(
            address as TimestampAddress<Depth>,
            getNextTimestamp(),
          );
          await syncExceptTransport(true, address);
        }
      }),
    );
  };

  const sendMessage = async (
    transport: ProtectedTransport,
    address: Address,
    node: MessageNode,
    receivedContext: Context = {},
    to?: string,
  ) => {
    const message = [
      VERSION,
      0,
      dataDepth,
      address,
      node,
      (await getSendContext?.(receivedContext)) ?? {},
    ] as Message;
    await onSendMessage?.([...message], to);
    await transport._[SEND_MESSAGE](message, to);
  };

  const receiveMessage = hasConnectors
    ? (transport: ProtectedTransport, message: Message, from: string) =>
        queueIfStarted(async () => {
          onReceiveMessage?.([...message], from);
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
            (newNode) =>
              sendMessage(transport, address, newNode, context, from),
          );
        })
    : getVoid;

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
    if (size(address) == dataDepth!) {
      const myTimestamp = (await metaReadTimestamp!(address)) ?? EMPTY_STRING;
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
    if (size(address) == dataDepth!) {
      const myTimestamp = (await metaReadTimestamp!(address)) ?? EMPTY_STRING;
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
    if (size(address) < dataDepth!) {
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
    [otherSubNodeObj, partial]: MessageNodes,
    context: Context,
  ): Promise<MessageNode | undefined> => {
    if (size(address) < dataDepth!) {
      const mySubNodes: MessageNodes = partial
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
      started = true;
      await onStart?.();
      if (hasConnectors) {
        await sync();
      }
    }
  };

  const stop = async () => {
    if (started) {
      log('stop');
      started = false;
      await onStop?.();
    }
  };

  const isStarted = () => started;

  const destroy = async () => {
    await stop();
    log('destroy');
    await dataDetach?.();
    await metaDetach?.();
    await promiseAll(
      arrayMap(transports, (transport) => transport._[DETACH]()),
    );
  };

  const getDataConnector = () => dataConnector;

  const getMetaConnector = () => metaConnector;

  const getTransport = () => [...transports];

  const sync = hasConnectors
    ? async (address: AnyAddress<Depth> = [] as AnyAddress<Depth>) =>
        syncExceptTransport(true, address)
    : getVoid;

  const setAtom = hasConnectors
    ? (
        address: AtomAddress<Depth>,
        atom: Atom,
        context?: Context,
        sync?: boolean,
      ) => setOrDelAtom(address, atom, context, sync)
    : getVoid;

  const delAtom = hasConnectors
    ? (address: AtomAddress<Depth>, context?: Context, sync?: boolean) =>
        setOrDelAtom(address, undefined, context, sync)
    : getVoid;

  const getData = hasConnectors
    ? async () => (await dataGetData?.()) ?? (await getDataForAddress()) ?? {}
    : getEmptyObject;

  const getMeta = hasConnectors
    ? async () => (await metaGetMeta?.()) ?? (await getMetaForAddress()) ?? {}
    : getEmptyObject;

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
    _: [syncChangedAtoms, receiveMessage],
  };

  await dataAttach?.(synclet);
  await metaAttach?.(synclet);
  await promiseAll(
    arrayMap(transports, (transport) => transport._[ATTACH](synclet)),
  );

  return objFreeze(synclet);
}) as typeof createSyncletDecl;
