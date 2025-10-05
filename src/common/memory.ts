import {createDataConnector, createMetaConnector} from '@synclets';
import type {
  AnyParentAddress,
  Atom,
  Atoms,
  AtomsAddress,
  Context,
  Data,
  DataConnector,
  Meta,
  MetaConnector,
  Timestamp,
  TimestampAddress,
  Timestamps,
  TimestampsAddress,
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

  const readAtom = async (
    address: TimestampAddress<Depth>,
    _context: Context,
  ) =>
    objDeepAction(data, address, (parent, id) => parent[id]) as
      | Atom
      | undefined;

  const writeAtom = async (
    address: LeafAddressFor<Depth>,
    atom: Atom,
    _context: Context,
  ) =>
    await objDeepAction(
      data,
      address,
      async (parent, id) => {
        parent[id] = atom;
        await onChange?.(data);
      },
      true,
    );

  const removeAtom = async (
    address: LeafAddressFor<Depth>,
    _context: Context,
  ) =>
    await objDeepAction(
      data,
      address,
      async (parent, id) => {
        delete parent[id];
        await onChange?.(data);
      },
      true,
      true,
    );

  const readChildIds = async (
    address: AnyParentAddress<Depth>,
    _context: Context,
  ) =>
    isEmpty(address)
      ? objKeys(data)
      : (objDeepAction(data, address, (parent, id) =>
          objKeys(parent[id] as Data),
        ) ?? []);

  const readAtoms = async (address: AtomsAddress<Depth>, _context: Context) =>
    objDeepAction(data, address, (parent, id) => parent[id] ?? {}) as Atoms;

  return await createDataConnector<Depth>(
    depth,
    {readAtom, writeAtom, removeAtom, readChildIds, readAtoms},
    {getData: async () => jsonParse(jsonString(data))},
  );
};

export const createMemoryMetaConnector = async <Depth extends number>(
  depth: Depth,
  onChange?: (meta: Meta) => Promise<void>,
  initial?: Meta,
): Promise<MetaConnector<Depth>> => {
  const meta: Meta = initial ?? {};

  const readTimestamp = async (
    address: TimestampAddress<Depth>,
    _context: Context,
  ) =>
    objDeepAction(meta, address, (parent, id) => parent[id]) as
      | Timestamp
      | undefined;

  const writeTimestamp = async (
    address: TimestampAddress<Depth>,
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

  const readChildIds = async (
    address: AnyParentAddress<Depth>,
    _context: Context,
  ) =>
    isEmpty(address)
      ? objKeys(meta)
      : (objDeepAction(meta, address, (parent, id) =>
          objKeys(parent[id] as Meta),
        ) ?? []);

  const readTimestamps = async (
    address: TimestampsAddress<Depth>,
    _context: Context,
  ) =>
    objDeepAction(
      meta,
      address,
      (parent, id) => parent[id] ?? {},
    ) as Timestamps;

  return await createMetaConnector(
    depth,
    {readTimestamp, writeTimestamp, readChildIds, readTimestamps},
    {getMeta: async () => jsonParse(jsonString(meta))},
  );
};
