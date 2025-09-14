import {createConnector} from '@synclets';
import type {Address, Atom, Context, Hash, Timestamp} from '@synclets/@types';
import type {
  createFileConnector as createFileConnectorDecl,
  FileConnector,
  FileConnectorImplementations,
  FileConnectorOptions,
} from '@synclets/@types/connector/fs';
import {
  arraySlice,
  isUndefined,
  jsonParse,
  jsonString,
  objKeys,
  size,
  UTF8,
  validateFile,
} from '@synclets/utils';
import {readFile, writeFile} from 'fs/promises';

type Node = [Hash, SubNodes] | [Timestamp, Atom | undefined];
type SubNodes = {[id: string]: Node};

export const createFileConnector: typeof createFileConnectorDecl = async (
  {isParent}: FileConnectorImplementations,
  {file, ...options}: FileConnectorOptions,
): Promise<FileConnector> => {
  const path = await validateFile(file);

  let data: Node;

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
    const subNodes = node[1] as SubNodes;
    const nextId = address[depth];
    if (isUndefined(subNodes[nextId])) {
      if (create) {
        subNodes[nextId] = (await isParent(
          arraySlice(address, 0, depth),
          context,
        ))
          ? [0, {}]
          : ['', undefined];
      } else {
        return undefined;
      }
    }
    return nodeAtAddress(subNodes[nextId], address, context, create, depth + 1);
  };

  const load = async () => {
    data = jsonParse(await readFile(path, UTF8)) ?? [];
  };

  const save = () => writeFile(path, jsonString(data), UTF8);

  const connector = await createConnector(
    {
      connect: load,

      disconnect: async () => {
        data = undefined as any;
      },

      readAtom: async (address: Address, context: Context) =>
        (await nodeAtAddress(data, address, context))?.[1] as Atom | undefined,

      readTimestamp: async (address: Address, context: Context) =>
        (await nodeAtAddress(data, address, context))?.[0] as
          | Timestamp
          | undefined,

      readHash: async (address: Address, context: Context) =>
        (await nodeAtAddress(data, address, context))?.[0] as Hash | undefined,

      writeAtom: async (address: Address, atom: Atom, context: Context) => {
        (await nodeAtAddress(data, address, context, true))![1] = atom;
        save();
      },

      writeTimestamp: async (
        address: Address,
        timestamp: Timestamp,
        context: Context,
      ) => {
        (await nodeAtAddress(data, address, context, true))![0] = timestamp;
        save();
      },

      writeHash: async (address: Address, hash: Hash, context: Context) => {
        (await nodeAtAddress(data, address, context, true))![0] = hash;
        save();
      },

      removeAtom: async (address: Address, context: Context) => {
        (await nodeAtAddress(data, address, context, true))![1] = undefined;
        save();
      },

      isParent,

      readChildIds: async (address: Address, context: Context) =>
        objKeys((await nodeAtAddress(data, address, context))?.[1] as SubNodes),
    },
    options,
  );

  // --

  return {
    ...connector,

    getFile: () => file,
  };
};
