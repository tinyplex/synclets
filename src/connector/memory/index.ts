import {createConnector} from '@synclets';
import type {
  Address,
  Atom,
  ConnectorOptions,
  Context,
  Hash,
  Timestamp,
} from '@synclets/@types';
import type {
  createMemoryConnector as createMemoryConnectorDecl,
  DataNode,
  MemoryConnector,
  MemoryConnectorImplementations,
  MetaNode,
} from '@synclets/@types/connector/memory';
import {
  isAtom,
  isHash,
  isObject,
  isTimestamp,
  isUndefined,
  objKeys,
  objMap,
  size,
} from '@synclets/utils';

type Node = [Hash, {[id: string]: Node}] | [Timestamp, Atom | undefined];

const getDataNode = (node: Node): DataNode =>
  isTimestamp(node[0])
    ? (node[1] as Atom | undefined)
    : objMap(node[1] as {[id: string]: Node}, getDataNode);

const getMetaNode = (node: Node): MetaNode =>
  isTimestamp(node[0])
    ? (node[0] as Timestamp | undefined)
    : [node[0], objMap(node[1] as {[id: string]: Node}, getMetaNode)];

export const createMemoryConnector: typeof createMemoryConnectorDecl = async (
  {atomDepth}: MemoryConnectorImplementations,
  options: ConnectorOptions = {},
): Promise<MemoryConnector> => {
  const nodes: Node = atomDepth > 0 ? [0, {}] : ['', undefined];

  const nodeAtAddress = async (
    node: Node,
    address: Address,
    context: Context,
    create = false,
    depth = 0,
  ): Promise<Node | undefined> => {
    if (size(address) == depth) {
      return node;
    }
    const subNodes = node[1] as {[id: string]: Node};
    const nextId = address[depth];
    if (isUndefined(subNodes[nextId])) {
      if (create) {
        subNodes[nextId] = atomDepth > depth ? [0, {}] : ['', undefined];
      } else {
        return undefined;
      }
    }
    return nodeAtAddress(subNodes[nextId], address, context, create, depth + 1);
  };

  const writeAtom = async (
    address: Address,
    atom: Atom | undefined,
    context: Context,
  ) => {
    const node = await nodeAtAddress(nodes, address, context);
    if (isTimestamp(node?.[0])) {
      node[1] = atom;
    }
  };

  const connector = await createConnector(
    {
      atomDepth,

      readAtom: async (address: Address, context: Context) => {
        const node = await nodeAtAddress(nodes, address, context);
        if (isTimestamp(node?.[0]) && isAtom(node[1])) {
          return node[1];
        }
      },

      readTimestamp: async (address: Address, context: Context) => {
        const node = await nodeAtAddress(nodes, address, context);
        if (isTimestamp(node?.[0])) {
          return node[0];
        }
      },

      readHash: async (address: Address, context: Context) => {
        const node = await nodeAtAddress(nodes, address, context);
        if (isHash(node?.[0])) {
          return node[0];
        }
      },

      writeAtom,

      writeTimestamp: async (
        address: Address,
        timestamp: Timestamp,
        context: Context,
      ) => {
        const node = await nodeAtAddress(nodes, address, context);
        if (isTimestamp(node?.[0])) {
          node[0] = timestamp;
        }
      },

      writeHash: async (address: Address, hash: Hash, context: Context) => {
        const node = await nodeAtAddress(nodes, address, context);
        if (isHash(node?.[0])) {
          node[0] = hash;
        }
      },

      removeAtom: (address: Address, context: Context) =>
        writeAtom(address, undefined, context),

      readChildIds: async (address: Address, context: Context) => {
        const node = await nodeAtAddress(nodes, address, context);
        if (isHash(node?.[0]) && isObject(node[1])) {
          return objKeys(node[1]);
        }
      },
    },
    options,
  );

  // --

  return {
    ...connector,

    dumpData: () => getDataNode(nodes),
    dumpMeta: () => getMetaNode(nodes),
  };
};
