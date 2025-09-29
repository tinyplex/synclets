import {
  Address,
  Atom,
  Context,
  createSynclet as createSyncletDecl,
  Data,
  Hash,
  LogLevel,
  Meta,
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
import {combineHash, getHash} from '../common/codec.ts';
import {getHlcFunctions} from '../common/hlc.ts';
import {objKeys, objNotEmpty, objToArray} from '../common/object.ts';
import {
  errorNew,
  ifNotUndefined,
  isEmpty,
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
  ProtectedDataConnector,
  ProtectedMetaConnector,
  ProtectedSynclet,
  ProtectedTransport,
} from './types.js';

const VERSION = 1;

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
      dataBind,
      dataReadAtom,
      dataWriteAtom,
      dataRemoveAtom,
      dataReadChildIds,
    ],
    $: [dataGetData],
  } = dataConnector;
  const {
    _: [
      metaDepth,
      metaBind,
      metaReadTimestamp,
      metaReadHash,
      metaWriteTimestamp,
      metaWriteHash,
      metaReadChildIds,
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
    if (!isEmpty(address)) {
      const hashChange = combineHash(
        getHash(oldTimestamp),
        getHash(newTimestamp),
      );
      let parentAddress = [...address];
      while (!isEmpty(parentAddress)) {
        const queuedAddress = (parentAddress = parentAddress.slice(0, -1));
        arrayPush(tasks, async () => {
          await metaWriteHash(
            queuedAddress,
            combineHash(await metaReadHash(queuedAddress, context), hashChange),
            context,
          );
        });
      }
    }
    if (syncOrFromTransport) {
      arrayPush(tasks, () => syncExcept(address, syncOrFromTransport));
    }

    await queue(...tasks);
  };

  const getData = async (address: Address): Promise<Data | undefined> => {
    const data = {} as {[id: string]: Data | Atom};
    await promiseAll(
      arrayMap((await dataReadChildIds(address, {})) ?? [], async (childId) =>
        ifNotUndefined(
          await (size(address) == dataDepth - 1 ? dataReadAtom : getData)(
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
    const meta = [await metaReadHash(address, {}), {}] as [
      Hash,
      {[id: string]: Meta | Timestamp},
    ];
    await promiseAll(
      arrayMap((await metaReadChildIds(address, {})) ?? [], async (childId) => {
        ifNotUndefined(
          await (size(address) == dataDepth - 1 ? metaReadTimestamp : getMeta)(
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

  const readHashOrTimestamp = async (address: Address, context: Context) =>
    size(address) < dataDepth
      ? ((await metaReadHash(address, context)) ?? 0)
      : ((await metaReadTimestamp(address, context)) ?? EMPTY_STRING);

  const readFullNodesOrAtomAndTimestamp = async (
    address: Address,
    context: Context,
  ): Promise<ProtocolSubNodes | TimestampAndAtom | undefined> => {
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
  ): Promise<ProtocolSubNodes> => {
    const subNodeObj: {[id: string]: ProtocolNode} = {};
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

  const sync = (address: Address) => syncExcept(address);

  const syncExcept = async (
    address: Address,
    exceptTransport?: ProtectedTransport | boolean,
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
  ): Promise<ProtocolNode | undefined> => {
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
  ): Promise<ProtocolNode | undefined> => {
    if (size(address) < dataDepth) {
      if (otherHash !== (await metaReadHash(address, context))) {
        const subNodeObj: {[id: string]: ProtocolNode} = {};
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
    [otherSubNodeObj, partial]: ProtocolSubNodes,
    context: Context,
  ): Promise<ProtocolNode | undefined> => {
    if (size(address) < dataDepth) {
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
        await dataConnector.connect();
        await metaConnector.connect();
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
        await dataConnector.disconnect();
        await metaConnector.disconnect();
        await promiseAll(arrayMap(transports, (transport) => transport._[2]()));
      }
    },

    isStarted: () => started,

    sync,

    getDataConnector: () => dataConnector,

    getMetaConnector: () => metaConnector,

    getTransport: () => [...transports],

    setAtom: (
      address: Address,
      atom: Atom,
      context?: Context,
      sync?: boolean,
    ) => setOrDelAtom(address, atom, context, sync),

    delAtom: (address: Address, context?: Context, sync?: boolean) =>
      setOrDelAtom(address, undefined, context, sync),

    getData: async () =>
      (await dataGetData?.()) ?? (((await getData([])) ?? {}) as Data),

    getMeta: async () =>
      (await metaGetMeta?.()) ?? (((await getMeta([])) ?? {}) as Meta),

    _: [syncExcept],
  };

  dataBind(synclet);
  metaBind(synclet);
  arrayForEach(transports, (transport) => transport._[0](synclet));

  return synclet;
}) as any;
