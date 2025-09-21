import {createConnector} from '@synclets';
import type {
  Address,
  Atom,
  ConnectorOptions,
  Context,
  Data,
  Hash,
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
  size,
} from '@synclets/utils';

type HashContainer = [Hash, {[id: string]: HashContainer | TimestampContainer}];
type TimestampContainer = [Timestamp, Atom | undefined];

const getData = (dataAndMeta: HashContainer): Data =>
  objMap(dataAndMeta[1], (child) =>
    isTimestamp(child[0])
      ? (child as TimestampContainer)[1]
      : getData(child as HashContainer),
  );

export const createMemoryConnector: typeof createMemoryConnectorDecl = async (
  atomDepth,
  {onWrite}: MemoryConnectorImplementations = {},
  options: ConnectorOptions = {},
): Promise<MemoryConnector> => {
  let dataAndMeta: HashContainer = [0, {}];

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
    const container = getContainer(dataAndMeta, address, context, true);
    if (isTimestamp(container?.[0])) {
      container[1] = atom;
      await onWrite?.();
    }
  };

  const connector = await createConnector(
    atomDepth,
    {
      readAtom: async (address: Address, context: Context) => {
        const container = getContainer(dataAndMeta, address, context);
        if (isTimestamp(container?.[0]) && isAtom(container[1])) {
          return container[1];
        }
      },

      readTimestamp: async (address: Address, context: Context) => {
        const container = getContainer(dataAndMeta, address, context);
        if (isTimestamp(container?.[0])) {
          return container[0];
        }
      },

      readHash: async (address: Address, context: Context) => {
        const container = getContainer(dataAndMeta, address, context);
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
        const container = getContainer(dataAndMeta, address, context, true);
        if (isTimestamp(container?.[0])) {
          container[0] = timestamp;
          await onWrite?.();
        }
      },

      writeHash: async (address: Address, hash: Hash, context: Context) => {
        const container = getContainer(dataAndMeta, address, context, true);
        if (isHash(container?.[0])) {
          container[0] = hash;
          await onWrite?.();
        }
      },

      removeAtom: (address: Address, context: Context) =>
        writeAtom(address, undefined, context),

      readChildIds: async (address: Address, context: Context) => {
        const container = getContainer(dataAndMeta, address, context);
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

    getData: () => getData(dataAndMeta) as Data,

    getJson: () => jsonString(dataAndMeta),

    setJson: (json: string) => {
      dataAndMeta = jsonParse(json) as HashContainer;
    },
  };
};
