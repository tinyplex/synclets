import {createDataConnector, createMetaConnector} from '@synclets';
import type {
  Address,
  Atom,
  Atoms,
  Context,
  Data,
  DataConnector,
  Meta,
  MetaConnector,
  Timestamp,
  Timestamps,
} from '@synclets/@types';
import {jsonParse, jsonString} from '@synclets/utils';
import {objDeepAction, objKeys} from './object.ts';
import {isEmpty} from './other.ts';

export const createMemoryDataConnector = async <Depth extends number>(
  depth: Depth,
  onChange?: (data: Data) => Promise<void>,
  initial?: Data,
): Promise<DataConnector<Depth>> => {
  const data: Data = initial ?? {};

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
    isEmpty(address)
      ? objKeys(data)
      : (objDeepAction(data, address, (parent, id) =>
          objKeys(parent[id] as Data),
        ) ?? []);

  const readAtoms = async (address: Address, _context: Context) =>
    objDeepAction(data, address, (parent, id) => parent[id] ?? {}) as Atoms;

  const connector = await createDataConnector(
    depth,
    {readAtom, writeAtom, removeAtom, readChildIds, readAtoms},
    {getData: async () => jsonParse(jsonString(data))},
  );

  return connector;
};

export const createMemoryMetaConnector = async <Depth extends number>(
  depth: Depth,
  onChange?: (meta: Meta) => Promise<void>,
  initial?: Meta,
): Promise<MetaConnector<Depth>> => {
  const meta: Meta = initial ?? {};

  const readTimestamp = async (address: Address, _context: Context) =>
    objDeepAction(meta, address, (parent, id) => parent[id]) as
      | Timestamp
      | undefined;

  const writeTimestamp = async (
    address: Address,
    timestamp: Timestamp,
    _context: Context,
  ) =>
    objDeepAction(
      meta,
      address,
      (parent, id) => {
        parent[id] = timestamp;
        onChange?.(meta);
      },
      true,
      true,
    );

  const readChildIds = async (address: Address, _context: Context) =>
    isEmpty(address)
      ? objKeys(meta)
      : (objDeepAction(meta, address, (parent, id) =>
          objKeys(parent[id] as Meta),
        ) ?? []);

  const readTimestamps = async (address: Address, _context: Context) =>
    objDeepAction(
      meta,
      address,
      (parent, id) => parent[id] ?? {},
    ) as Timestamps;

  const connector = await createMetaConnector(
    depth,
    {readTimestamp, writeTimestamp, readChildIds, readTimestamps},
    {getMeta: async () => jsonParse(jsonString(meta))},
  );

  return connector;
};
