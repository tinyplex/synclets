import {createDataConnector, createMetaConnector} from '@synclets';
import type {
  Address,
  Atom,
  Context,
  Data,
  DataConnector,
  Hash,
  Meta,
  MetaConnector,
  Timestamp,
} from '@synclets/@types';
import {jsonParse, jsonString} from '../utils/json.ts';
import {isObject, objDeepAction, objKeys, objMap, objNew} from './object.ts';
import {isUndefined, size} from './other.ts';
import {isHash, isTimestamp} from './types.ts';

export type Root = HashContainer;
type HashContainer = [Hash, {[id: string]: HashContainer | TimestampContainer}];
type TimestampContainer = [Timestamp, Atom | undefined];

const getMeta = (dataAndMeta: HashContainer): Meta => [
  dataAndMeta[0],
  objMap(dataAndMeta[1], (child) =>
    isTimestamp(child[0])
      ? (child as TimestampContainer)[0]
      : getMeta(child as HashContainer),
  ),
];

export const createMemoryDataConnector = async (
  depth: number,
  onChange?: (data: Data) => Promise<void>,
  initial?: Data,
): Promise<DataConnector> => {
  const data: Data = initial || objNew();

  const readAtom = async (address: Address, _context: Context) =>
    objDeepAction(data, address, (parent, id) => parent[id]) as
      | Atom
      | undefined;

  const writeAtom = async (address: Address, atom: Atom, _context: Context) =>
    objDeepAction(
      data,
      address,
      (parent, id) => {
        parent[id] = atom;
        onChange?.(data);
      },
      true,
    );

  const removeAtom = async (address: Address, _context: Context) =>
    objDeepAction(
      data,
      address,
      (parent, id) => {
        delete parent[id];
        onChange?.(data);
      },
      true,
      true,
    );

  const readChildIds = async (address: Address, _context: Context) =>
    objDeepAction(data, address, (parent, id) => objKeys(parent[id] as Data));

  const connector = await createDataConnector(
    depth,
    {readAtom, writeAtom, removeAtom, readChildIds},
    {getData: async () => jsonParse(jsonString(data))},
  );

  return connector;
};

export const createMemoryMetaConnector = async (
  depth: number,
  onChange?: (root: Root) => Promise<void>,
  initial?: Root,
): Promise<MetaConnector> => {
  const root: Root = initial || [0, {}];

  const getContainer = (
    container: HashContainer,
    address: Address,
    context: Context,
    create = false,
    recursionDepth = 0,
  ): HashContainer | TimestampContainer | undefined => {
    if (size(address) == recursionDepth) {
      return container;
    }
    const children = container[1];
    const nextId = address[recursionDepth];
    if (isUndefined(children[nextId])) {
      if (create) {
        children[nextId] =
          depth > recursionDepth + 1 ? [0, {}] : ['', undefined];
      } else {
        return undefined;
      }
    }
    return getContainer(
      children[nextId] as HashContainer,
      address,
      context,
      create,
      recursionDepth + 1,
    );
  };

  const connector = await createMetaConnector(
    depth,
    {
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

      writeTimestamp: async (
        address: Address,
        timestamp: Timestamp,
        context: Context,
      ) => {
        const container = getContainer(root, address, context, true);
        if (isTimestamp(container?.[0])) {
          container[0] = timestamp;
          await onChange?.(root);
        }
      },

      writeHash: async (address: Address, hash: Hash, context: Context) => {
        const container = getContainer(root, address, context, true);
        if (isHash(container?.[0])) {
          container[0] = hash;
          await onChange?.(root);
        }
      },

      readChildIds: async (address: Address, context: Context) => {
        const container = getContainer(root, address, context);
        if (isHash(container?.[0]) && isObject(container[1])) {
          return objKeys(container[1]);
        }
      },
    },
    {getMeta: async () => getMeta(root) as Meta},
  );

  return connector;
};
