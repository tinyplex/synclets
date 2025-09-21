import {createConnector} from '@synclets';
import type {
  Address,
  Atom,
  ConnectorOptions,
  Context,
  Data,
  Hash,
  Meta,
  Timestamp,
} from '@synclets/@types';
import type {
  createMemoryConnector as createMemoryConnectorDecl,
  MemoryConnector,
  MemoryConnectorImplementations,
} from '@synclets/@types/connector/memory';
import {
  isAtom,
  isHash,
  isObject,
  isTimestamp,
  isUndefined,
  jsonParse,
  jsonString,
  objKeys,
  objMap,
  objNotEmpty,
  size,
} from '@synclets/utils';

export type ProtectedMemoryConnector = MemoryConnector & {
  _getJson(): string;
  _setJson(json: string): void;
};

type HashContainer = [Hash, {[id: string]: HashContainer | TimestampContainer}];
type TimestampContainer = [Timestamp, Atom | undefined];

const getData = (dataAndMeta: HashContainer): Data =>
  objMap(dataAndMeta[1], (child) => {
    if (isTimestamp(child[0])) {
      return (child as TimestampContainer)[1] as Atom;
    }
    const childData = getData(child as HashContainer);
    return objNotEmpty(childData) ? childData : (undefined as any);
  });
const getMeta = (dataAndMeta: HashContainer): Meta => [
  dataAndMeta[0],
  objMap(dataAndMeta[1], (child) =>
    isTimestamp(child[0])
      ? (child as TimestampContainer)[0]
      : getMeta(child as HashContainer),
  ),
];

export const createMemoryConnector: typeof createMemoryConnectorDecl = async (
  atomDepth,
  {onWrite}: MemoryConnectorImplementations = {},
  options: ConnectorOptions = {},
): Promise<MemoryConnector> => {
  let root: HashContainer = [0, {}];

  const getContainer = (
    container: HashContainer,
    address: Address,
    context: Context,
    create = false,
    depth = 0,
  ): HashContainer | TimestampContainer | undefined => {
    if (size(address) == depth) {
      return container;
    }
    const children = container[1];
    const nextId = address[depth];
    if (isUndefined(children[nextId])) {
      if (create) {
        children[nextId] = atomDepth > depth + 1 ? [0, {}] : ['', undefined];
      } else {
        return undefined;
      }
    }
    return getContainer(
      children[nextId] as HashContainer,
      address,
      context,
      create,
      depth + 1,
    );
  };

  const writeAtom = async (
    address: Address,
    atom: Atom | undefined,
    context: Context,
  ) => {
    const container = getContainer(root, address, context, true);
    if (isTimestamp(container?.[0])) {
      container[1] = atom;
      await onWrite?.();
    }
  };

  const connector = await createConnector(
    atomDepth,
    {
      readAtom: async (address: Address, context: Context) => {
        const container = getContainer(root, address, context);
        if (isTimestamp(container?.[0]) && isAtom(container[1])) {
          return container[1];
        }
      },

      readTimestamp: async (address: Address, context: Context) => {
        const container = getContainer(root, address, context);
        if (isTimestamp(container?.[0])) {
          return container[0];
        }
      },

      readHash: async (address: Address, context: Context) => {
        const container = getContainer(root, address, context);
        if (isHash(container?.[0])) {
          return container[0];
        }
      },

      writeAtom,

      writeTimestamp: async (
        address: Address,
        timestamp: Timestamp,
        context: Context,
      ) => {
        const container = getContainer(root, address, context, true);
        if (isTimestamp(container?.[0])) {
          container[0] = timestamp;
          await onWrite?.();
        }
      },

      writeHash: async (address: Address, hash: Hash, context: Context) => {
        const container = getContainer(root, address, context, true);
        if (isHash(container?.[0])) {
          container[0] = hash;
          await onWrite?.();
        }
      },

      removeAtom: (address: Address, context: Context) =>
        writeAtom(address, undefined, context),

      readChildIds: async (address: Address, context: Context) => {
        const container = getContainer(root, address, context);
        if (isHash(container?.[0]) && isObject(container[1])) {
          return objKeys(container[1]);
        }
      },
    },
    options,
  );

  // --

  return {
    ...connector,

    getData: () => getData(root) as Data,

    getMeta: () => getMeta(root) as Meta,

    _getJson: () => jsonString(root),

    _setJson: (json: string) => {
      root = json ? jsonParse(json) : [0, {}];
    },
  } as ProtectedMemoryConnector;
};
